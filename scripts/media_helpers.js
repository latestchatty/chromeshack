/*
 *  Resolvers
 */

const getEmbedInfo = link => {
    // resolves the postId and index of a link
    if (link == null) return;
    let _linkInfo = link.firstElementChild.id.split(/[\_\-]/);
    if (_linkInfo != null) {
        let _id = _linkInfo[1];
        let _idx = _linkInfo[2];
        return {
            id: _id,
            index: _idx
        };
    }
};

const getLinkRef = embed => {
    // resolves the link of an embed in a postBody
    if (embed == null) return;
    let _embedInfo = embed.id.split(/[\_\-]/);
    if (_embedInfo != null) {
        let _linkRef = document.querySelector(`.postbody div[id^='expando_${_embedInfo[1]}-${_embedInfo[2]}']`);
        return _linkRef.parentNode;
    }
};

const getEmbedRef = link => {
    // resolves the embed associated with a link (if any exist)
    if (link == null) return;
    let infoObj = getEmbedInfo(link);
    if (infoObj && infoObj.id && infoObj.index) {
        let _getpostEmbed = document.querySelector(`.postbody > div[id='getpost_${infoObj.id}-${infoObj.index}']`);
        let _mediaEmbed = document.querySelector(`.media-container [id$='_${infoObj.id}-${infoObj.index}']`);
        return _getpostEmbed || _mediaEmbed;
    }
};

const getIframeDimensions = elem => {
    // resolve the width and height of an iframe child
    // this element must have a parent that is not media-container
    if (elem == null) return;
    let _ref =
        elem.querySelector(".iframe-container iframe") ||
        elem.querySelector(".yt-container iframe") ||
        elem.querySelector(".twitch-container iframe") ||
        elem.querySelector(".instgrm-container");
    let _width = _ref && _ref.width != null && _ref.width;
    let _height = _ref && _ref.height != null && _ref.height;
    return { width: _width, height: _height, ref: _ref };
};

const locateContainer = (link, postId, index) => {
    // resolve our link container for media embedding (or create one)
    /*let _isAlternateStyle = true; //settingsContain("alternate_embed_style"));
    let container = _isAlternateStyle ?
        link.parentNode.querySelector(`div#link_${postId}-${index}.media-container`) :
        link.parentNode.querySelector("div.media-container"); */
    let container = link.parentNode && link.parentNode.querySelector(`div#link_${postId}-${index}.media-container`);
    if (container) {
        return container; // return the existing container
    } else {
        container = document.createElement("div");
        container.setAttribute("class", "media-container");
        // flag the container so we know we have an embed child
        /* if (_isAlternateStyle) { container.setAttribute("id", `link_${postId}-${index}`); } */
        container.setAttribute("id", `link_${postId}-${index}`);
        return container;
    }
};

/*
 *  State Transition Toggles
 */

const toggleMediaItem = (link, postId, index) => {
    // abstracted helper for toggling media container items from a link/expando
    let container = locateContainer(link, postId, index);
    let _embed = getEmbedRef(link);

    // pretty aggressive way to handle stopping an iframe player when toggling the container
    let encapMediaObj = getIframeDimensions(_embed);
    let embedContainer = null;
    if (encapMediaObj && encapMediaObj.ref) {
        // remove our media child if it contains a video element otherwise allow toggle("hidden")
        let altContainer =
            true /*settingsContain("alternate_embed_style"))*/ && container.parentNode;
        if (
            objContains("iframe-spacer", encapMediaObj.ref.parentNode.parentNode.classList) ||
            objContains("instgrm-container", encapMediaObj.ref.parentNode.parentNode.classList)
        )
            embedContainer = encapMediaObj.ref.parentNode.parentNode;
        else embedContainer = encapMediaObj.ref;

        if (!!altContainer) altContainer.removeChild(container);
        else container.removeChild(embed);
        return toggleMediaLink(_embed, link, true);
    }

    return toggleMediaLink(_embed, link);
};

const toggleMediaLink = (embedElem, link, override) => {
    let _expando = link.querySelector(".expando");
    // state toggle our various embed children
    if (override) {
        // edge case when forcefully removing an embed child
        link.classList.toggle("embedded");
        toggleExpandoButton(_expando);
        triggerReflow(embedElem);
        return true;
    } else if (embedElem) {
        if (
            embedElem.nodeName === "IMG" ||
            embedElem.nodeName === "VIDEO" ||
            objContains("yt-container", embedElem.classList) ||
            objContains("twitch-container", embedElem.classList) ||
            objContains("iframe-container", embedElem.classList)
        )
            embedElem.parentNode.classList.toggle("hidden");
        else embedElem.classList.toggle("hidden");

        toggleVideoState(embedElem);
        link.classList.toggle("embedded");
        toggleExpandoButton(_expando);
        triggerReflow(embedElem);
        return true;
    }
    return false;
};

const toggleVideoState = (elem, stateObj) => {
    let play = () => {
        video.currentTime = 0;
        video.play();
    };
    let pause = () => {
        video.pause();
        video.currentTime = 0;
    };

    let { state, mute } = stateObj || {};
    if (elem == null) return;
    let video = elem.matches("video[id^='loader_']") ? elem : elem.querySelector("video[id^='loader_']");
    // if forced then play and avoid social embeds
    let excludedParent =
        video &&
        video.closest(`
        .swiper-wrapper,
        .instgrm-embed,
        #twitter-media-content,
        #twitter-quote-media-content
    `);

    if ((video && (state || mute)) || (video && !objContains("hidden", video.classList))) {
        if (state) play();
        else if (!excludedParent && video.paused) {
            play();
        } else pause();

        if (!mute || video.muted) video.muted = false;
        else video.muted = true;
    }
};

const toggleExpandoButton = expando => {
    // abstracted helper for toggling the state of a link-expando button from a post
    if (expando && !objContains("collapso", expando.classList)) {
        // override is the expando 'button' element
        expando.innerText = "\ue90d"; // circle-arrow-down
        return expando.classList.add("collapso");
    } else if (expando) {
        expando.innerText = "\ue907"; // circle-arrow-up
        return expando.classList.remove("collapso");
    }
};

/*
 *  Media Insertion Functions
 */

const mediaContainerInsert = (elem, link, id, index) => {
    // abstracted helper for manipulating the media-container grid from a post
    let container = locateContainer(link, id, index);
    let _hasMedia = container != null && getEmbedRef(link);
    let _isExpando = link.classList != null && objContains("expando", link.classList);
    let _postBody = _isExpando ? link.parentNode.parentNode : link.parentNode;
    if (_hasMedia) {
        return toggleMediaLink(_hasMedia, link);
    }

    // don't put click events on the carousel
    attachChildEvents(elem, id, index);
    container.appendChild(elem);
    if (true /*await settingsContain("alternate_embed_style"))*/ && !_hasMedia) {
        // insert items below their associated link
        _postBody.insertBefore(container, link.nextSibling);
    } else if (!_hasMedia) {
        container.setAttribute("class", "media-container responsive");
        _postBody.appendChild(container);
    }
    // pass our newly appended media element to our state manager
    elem = container.querySelector(`[id$='_${id}-${index}']`);
    toggleMediaLink(elem, link);
};

const appendMedia = (src, link, postId, index, container, overrides) => {
    let createMediaElem = (href, postId, index, override) => {
        let _animExt = /\.(mp4|gifv|webm)/i.test(href);
        let _staticExt = /\.(jpe?g|gif|png)/i.test(href);
        let _elem;
        if (_animExt) {
            _elem = document.createElement("video");
            if (!override) {
                _elem.setAttribute("loop", "");
            } else {
                _elem.setAttribute("controls", ""); // for Instagram/Twitter
            }
        } else if (_staticExt) _elem = document.createElement("img");

        _elem.setAttribute("id", `loader_${postId}-${index}`);
        _elem.setAttribute("src", href);
        return _elem;
    };

    // compile our media items into a given container element
    // overrides include: forceAppend, twttrEmbed, and instgrmEmbed
    let mediaElem = container != null ? container : document.createElement("div");
    let { forceAppend, twttrEmbed, instgrmEmbed } = overrides;
    if (Array.isArray(src) && src.length > 0) {
        let nodeList = [];
        for (let item of src) {
            // let collator know we're working on an Instagram post
            if (instgrmEmbed || twttrEmbed || container) nodeList.push(createMediaElem(item, postId, index, true));
            else nodeList.push(createMediaElem(item, postId, index));
        }
        for (let node of nodeList) {
            mediaElem.appendChild(node);
        }
        // only use carousel if we have multiple items
        if (nodeList.length > 1) {
            mediaElem.setAttribute("id", `medialoader_${postId}-${index}`);
            mediaElem = insertCarousel(mediaElem);
        }
    } else {
        throw Error("Media array must contain at least one item!");
    }

    // only append if we're not being called to return an element
    if (forceAppend) {
        mediaElem.classList.add("medialoader", "hidden");
        mediaContainerInsert(mediaElem, link, postId, index);
    }
    return mediaElem;
};

/*
 *  Misc. Functions
 */

const insertScript = ({ elem, filePath, code, id, overwrite }) => {
    // insert a script that executes synchronously (caution!)
    let _elem = elem ? elem : document.getElementsByTagName("head")[0];
    let _script = document.getElementById(id);
    if (id && !overwrite && document.getElementById(id) != null) {
        return;
    } else if (overwrite && _script) {
        _script.parentNode.removeChild(_script);
    }
    _script = document.createElement("script");
    if (id) {
        _script.setAttribute("id", id);
    }
    if (code && code.length > 0) _script.textContent = code;
    else if (filePath && filePath.length > 0) _script.setAttribute("src", browser.runtime.getURL(filePath));
    else throw Error("Must pass a file path or code content in string format!");
    _elem.appendChild(_script);
};

const insertExpandoButton = (link, postId, index) => {
    // abstracted helper for appending an expando button to a link in a post
    if (link.querySelector("div.expando") != null) {
        return;
    }
    // process a link into a link container that includes a dynamic styled "button"
    let expando = document.createElement("div");
    expando.classList.add("expando");
    expando.id = `expando_${postId}-${index}`;
    expando.style.fontFamily = "Icon";
    expando.innerText = "\ue907";
    link.appendChild(expando);
};

const insertCarousel = elem => {
    let head = document.getElementsByTagName("head")[0];
    if (head.innerHTML.indexOf("swiper-4.5.0.min.css") == -1) {
        // make sure we have necessary css injected
        let carouselCSS = document.createElement("link");
        carouselCSS.rel = "stylesheet";
        carouselCSS.type = "text/css";
        carouselCSS.href = browser.runtime.getURL("ext/swiper/swiper-4.5.0.min.css");
        head.appendChild(carouselCSS);
    }
    let carouselContainer = document.createElement("div");
    carouselContainer.classList.add("swiper-container");
    let swiperNextButton = document.createElement("div");
    swiperNextButton.classList.add("swiper-button-next");
    let swiperPrevButton = document.createElement("div");
    swiperPrevButton.classList.add("swiper-button-prev");
    carouselContainer.appendChild(swiperNextButton);
    carouselContainer.appendChild(swiperPrevButton);
    // insert our media container into a carousel container
    // ... and rename the media container to be our carousel wrapper
    elem.classList.add("swiper-wrapper");
    // move our element container id to our carousel wrapper
    carouselContainer.setAttribute("id", elem.id);
    elem.removeAttribute("id");
    // set our swiper children as slides in the carousel
    for (let child of elem.childNodes) {
        child.classList.add("swiper-slide");
        if (child.nodeName === "VIDEO") {
            child.removeAttribute("autoplay");
            child.removeAttribute("muted");
        }
    }
    carouselContainer.appendChild(elem);
    // inject via background script (sendMessage)
    browser.runtime.sendMessage({ name: "injectCarousel", select: `#${carouselContainer.id}.swiper-container` });
    return carouselContainer;
};

const insertLightbox = elem => {
    let head = document.getElementsByTagName("head")[0];
    if (head.innerHTML.indexOf("basicLightbox-5.0.2.min.css") == -1) {
        // make sure we have necessary css injected
        let lightboxCSS = document.createElement("link");
        lightboxCSS.rel = "stylesheet";
        lightboxCSS.type = "text/css";
        lightboxCSS.href = browser.runtime.getURL("ext/basiclightbox/basicLightbox-5.0.2.min.css");
        head.appendChild(lightboxCSS);
    }
    browser.runtime.sendMessage({ name: "injectLightbox", elemText: elem.outerHTML });
};

const attachChildEvents = (elem, id, index) => {
    let childElems = Array.from(elem.querySelectorAll("video[id*='loader'], img[id*='loader']"));
    let iframeElem = getIframeDimensions(elem);

    if (iframeElem.id == null && childElems != null && childElems.length > 0) {
        // list of excluded containers
        let swiperEl = childElems[0].closest(".swiper-wrapper");
        let instgrmEl = childElems[0].closest(".instgrm-embed");
        let twttrEl = childElems[0].closest(".twitter-container");

        childElems.forEach(item => {
            if (item.nodeName === "IMG" || item.nodeName === "VIDEO") {
                if (childElems.length == 1) {
                    // don't interfere with carousel media settings
                    let canPlayCallback = e => {
                        // autoplay videos (muted) when shown (except for social embeds)
                        if (
                            !e.target.hasAttribute("initialPlay") &&
                            !e.target.closest(".twitter-container, .instgrm-embed")
                        ) {
                            e.target.setAttribute("initialPlay", "");
                            toggleVideoState(e.target, { state: true, mute: true });
                            // unsubscribe to avoid retriggering after video loads
                            e.target.removeEventListener("canplaythrough", canPlayCallback);
                        }
                    };
                    item.addEventListener("canplaythrough", canPlayCallback);
                } else {
                    item.addEventListener("click", e => {
                        // allow toggling play state by clicking the carousel video
                        if (e.target.nodeName === "VIDEO" && !e.target.hasAttribute("controls"))
                            toggleVideoState(e.target);
                    });
                }

                // don't attach click-to-hide events to excluded containers
                ((swiperEl, instgrmEl, twttrEl) => {
                    item.addEventListener("mousedown", async e => {
                        let embed = e.target.parentNode.querySelector(`#loader_${id}-${index}`);
                        let link = getLinkRef(embed);
                        let lightboxed = await getSetting("image_loader_newtab");
                        if (e.which === 2 && lightboxed) {
                            e.preventDefault();
                            // pause our current video before re-opening it
                            if (e.target.nodeName === "VIDEO") toggleVideoState(e.target, { state: false });
                            // reopen this element in a lightbox overlay
                            insertLightbox(e.target);
                        } else if (e.which === 1 && !swiperEl && !instgrmEl && !twttrEl) {
                            e.preventDefault();
                            // toggle our embed state when non-carousel media embed is left-clicked
                            toggleMediaLink(embed, link);
                        }
                    });
                })(swiperEl, instgrmEl, twttrEl);
            }
        });
    }
};

const triggerReflow = elem => {
    // workaround to fix Swiper not properly tracking onload events of children
    if (elem) {
        insertScript({
            elem: document.getElementsByTagName("body")[0],
            code: "window.dispatchEvent(new Event('resize'));",
            id: "reflow-wjs",
            overwrite: true
        });
    }
};
