/*
 *  Resolvers
 */

function getEmbedInfo(link) {
    // resolves the postId and index of a link
    if (link == null) return;
    var _linkInfo = link.firstElementChild.id.split(/[\_\-]/);
    if (_linkInfo != null) {
        var _id = _linkInfo[1];
        var _idx = _linkInfo[2];
        return {
            id: _id,
            index: _idx
        };
    }
}

function getLinkRef(embed) {
    // resolves the link of an embed in a postBody
    if (embed == null) return;
    var _embedInfo = embed.id.split(/[\_\-]/);
    if (_embedInfo != null)
        var _linkRef = document.querySelector(`.postbody div[id^='expando_${_embedInfo[1]}-${_embedInfo[2]}']`);
        return _linkRef.parentNode;
}

function getEmbedRef(link) {
    // resolves the embed associated with a link (if any exist)
    if (link == null) return;
    var infoObj = getEmbedInfo(link);
    if (infoObj && infoObj.id && infoObj.index) {
        var _getpostEmbed = document.querySelector(`.postbody > div[id='getpost_${infoObj.id}-${infoObj.index}']`);
        var _mediaEmbed = document.querySelector(`.media-container [id$='_${infoObj.id}-${infoObj.index}']`);
        return _getpostEmbed || _mediaEmbed;
    }
}

function getIframeDimensions(elem) {
    // resolve the width and height of an iframe child
    // this element must have a parent that is not media-container
    if (elem == null) return;
    var _ref = elem.querySelector(".iframe-container iframe") ||
                    elem.querySelector(".yt-container iframe") ||
                    elem.querySelector(".twitch-container iframe") ||
                    elem.querySelector(".instgrm-container");
    var _width = _ref && _ref.width != null && _ref.width;
    var _height = _ref && _ref.height != null && _ref.height;
    return { width: _width, height: _height, ref: _ref };
}


function locateContainer(link, postId, index) {
    // resolve our link container for media embedding (or create one)
    var _isAlternateStyle = true; //objContains("alternate_embed_style", getSetting("enabled_scripts"));
    var container = _isAlternateStyle ?
        link.parentNode.querySelector(`div#link_${postId}-${index}.media-container`) :
        link.parentNode.querySelector("div.media-container");
    if (container != null) {
        return container; // return the existing container
    } else {
        container = document.createElement("div");
        container.setAttribute("class", "media-container");
        // flag the container so we know we have an embed child
        if (_isAlternateStyle) { container.setAttribute("id", `link_${postId}-${index}`); }
        return container;
    }
}


/*
 *  State Transition Toggles
 */

function toggleMediaItem(link, postId, index) {
    // abstracted helper for toggling media container items from a link/expando
    var container = locateContainer(link, postId, index);
    var _embed = getEmbedRef(link);

    // pretty aggressive way to handle stopping an iframe player when toggling the container
    var encapMediaObj = getIframeDimensions(_embed);
    var embedContainer = null;
    if (encapMediaObj && encapMediaObj.ref) {
        // remove our media child if it contains a video element otherwise allow toggle("hidden")
        var altContainer = true /*objContains("alternate_embed_style", getSetting("enabled_scripts"))*/ && container.parentNode;
        if (objContains("iframe-spacer", encapMediaObj.ref.parentNode.parentNode.classList) ||
            objContains("instgrm-container", encapMediaObj.ref.parentNode.parentNode.classList))
            embedContainer = encapMediaObj.ref.parentNode.parentNode;
        else
            embedContainer = encapMediaObj.ref;

        if (!!altContainer)
            altContainer.removeChild(container);
        else
            container.removeChild(embed);
        return toggleMediaLink(_embed, link, true);
    }

    return toggleMediaLink(_embed, link);
}

function toggleMediaLink(embedElem, link, override) {
    var _expando = link.querySelector(".expando");
    // state toggle our various embed children
    if (override) {
        // edge case when forcefully removing an embed child
        link.classList.toggle("embedded");
        toggleExpandoButton(_expando);
        triggerReflow(embedElem);
        return true;
    }
    else if (embedElem) {
        if (embedElem.nodeName === "IMG" || embedElem.nodeName === "VIDEO" ||
            objContains("yt-container", embedElem.classList) ||
            objContains("twitch-container", embedElem.classList) ||
            objContains("iframe-container", embedElem.classList))
            embedElem.parentNode.classList.toggle("hidden");
        else
            embedElem.classList.toggle("hidden");
        toggleVideoState(embedElem);
        link.classList.toggle("embedded");
        toggleExpandoButton(_expando);
        triggerReflow(embedElem);
        return true;
    }
    return false;
}

function toggleVideoState(elem, override) {
    // abstracted helper for toggling html5 video embed pause state (based on audio)
    if (elem == null) return;
    // ignore carousel children when autoplaying
    var video = elem.nodeName === "VIDEO" ? elem : elem.querySelector("video:not(.swiper-slide)");
    if (override || video && !objContains("hidden", video.classList)) {
       if (video.paused || override) {
            video.currentTime = 0;
            video.play();
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }
}

function toggleExpandoButton(expando) {
    // abstracted helper for toggling the state of a link-expando button from a post
    if (expando && !objContains("collapso", expando.classList)) {
        // override is the expando 'button' element
        expando.innerText = "\ue90d"; // circle-arrow-down
        return expando.classList.add("collapso");
    } else if (expando) {
        expando.innerText = "\ue907"; // circle-arrow-up
        return expando.classList.remove("collapso");
    }
}

/*
 *  Media Insertion Functions
 */

function mediaContainerInsert(elem, link, id, index) {
    // abstracted helper for manipulating the media-container grid from a post
    var container = locateContainer(link, id, index);
    var _hasMedia = container != null && getEmbedRef(link);
    var _isExpando = link.classList != null && objContains("expando", link.classList);
    var _postBody = _isExpando ? link.parentNode.parentNode : link.parentNode;
    if (_hasMedia) { return toggleMediaLink(_hasMedia, link); }

    // don't put click events on the carousel
    attachChildEvents(elem, id, index);
    container.appendChild(elem);
    if (true /*objContains("alternate_embed_style", getSetting("enabled_scripts"))*/ && !_hasMedia) {
        // insert items below their associated link
        _postBody.insertBefore(container, link.nextSibling);
    } else if (!_hasMedia) {
        container.setAttribute("class", "media-container responsive");
        _postBody.appendChild(container);
    }
    // pass our newly appended media element to our state manager
    elem = container.querySelector(`[id$='_${id}-${index}']`);
    toggleMediaLink(elem, link);
}

function appendMedia(src, link, postId, index, container, override) {
    // compile our media items into a given container element
    var mediaElem = container != null ? container : document.createElement("div");
    if (Array.isArray(src)) {
        var nodeList = [];
        for (var item of src) {
            // let collator know we're working on an Instagram post
            if (container) { nodeList.push(createMediaElem(item, postId, index, true)); }
            else { nodeList.push(createMediaElem(item, postId, index)); }
        }
        for (var node of nodeList) {
            mediaElem.appendChild(node);
        }
        // only use carousel if we have multiple items
        if (nodeList.length > 1) {
            mediaElem.setAttribute("id", `medialoader_${postId}-${index}`);
            mediaElem = insertCarousel(mediaElem);
        }
    } else if (src != null && src.length > 0) {
        mediaElem.appendChild(createMediaElem(src, postId, index));
    }
    // only append if we're not being called to return an element
    if (!override) {
        mediaElem.classList.add("medialoader", "hidden");
        mediaContainerInsert(mediaElem, link, postId, index);
    } else { return mediaElem; }

    function createMediaElem(href, postId, index, override) {
        var _animExt = /\.(mp4|gifv|webm)/i.test(href);
        var _staticExt = /\.(jpe?g|gif|png)/i.test(href);
        var _elem;
        if (_animExt) {
            _elem = document.createElement("video");
            if (!override) {
                _elem.setAttribute("autoplay", "");
                _elem.setAttribute("muted", "");
                _elem.setAttribute("loop", "");
            } else {
                _elem.setAttribute("controls", ""); // for Instagram
            }
        }
        else if (_staticExt)
            _elem  = document.createElement("img");

        _elem.setAttribute("id", `loader_${postId}-${index}`);
        _elem.setAttribute("src", href);
        return _elem;
    }
}


/*
 *  Misc. Functions
 */

function insertScript(elem, { filePath, code }, id, overwrite) {
    // insert a script that executes synchronously (caution!)
    var _elem = elem ? elem : document.getElementsByTagName("head")[0];
    var _script = document.getElementById(id);
    if (id && !overwrite && document.getElementById(id) != null) { return; }
    else if (overwrite && _script) { _script.parentNode.removeChild(_script); }
    _script = document.createElement("script");
    if (id) { _script.setAttribute("id", id); }
    if (code && code.length > 0)
        _script.textContent = code;
    else if (filePath && filePath.length > 0)
        _script.setAttribute("src", filePath);
    else
        throw Error("Must pass a file path or code content in string format!");
    _elem.appendChild(_script);
}

function insertExpandoButton(link, postId, index) {
    // abstracted helper for appending an expando button to a link in a post
    if (link.querySelector("div.expando") != null) { return; }
    // process a link into a link container that includes a dynamic styled "button"
    var expando = document.createElement("div");
    expando.classList.add("expando");
    expando.id = `expando_${postId}-${index}`;
    expando.style.fontFamily = "Icon";
    expando.innerText = "\ue907";
    link.appendChild(expando);
}

function insertCarousel(elem) {
    var head = document.getElementsByTagName("head")[0];
    if (head.innerHTML.indexOf("swiper-4.5.0.min.css") == -1) {
        // make sure we have necessary css injected
        var carouselCSS = document.createElement("link");
        carouselCSS.rel = "stylesheet";
        carouselCSS.type = "text/css";
        carouselCSS.href = browser.runtime.getURL("ext/swiper/swiper-4.5.0.min.css");
        head.appendChild(carouselCSS);
    }
    var carouselContainer = document.createElement("div");
    carouselContainer.classList.add("swiper-container");
    var swiperNextButton = document.createElement("div");
    swiperNextButton.classList.add("swiper-button-next");
    var swiperPrevButton = document.createElement("div");
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
    for (var child of elem.childNodes) {
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
}

function insertLightbox(elem) {
    var head = document.getElementsByTagName("head")[0];
    if (head.innerHTML.indexOf("basicLightbox-5.0.2.min.css") == -1) {
        // make sure we have necessary css injected
        var lightboxCSS = document.createElement("link");
        lightboxCSS.rel = "stylesheet";
        lightboxCSS.type = "text/css";
        lightboxCSS.href = browser.runtime.getURL("ext/basiclightbox/basicLightbox-5.0.2.min.css");
        head.appendChild(lightboxCSS);
    }
    browser.runtime.sendMessage({ name: 'lightbox', elemText: elem.outerHTML });
}

function attachChildEvents(elem, id, index) {
    var childElems = [].concat(
        Array.from(elem.querySelectorAll("video")),
        Array.from(elem.querySelectorAll("img"))
    );
    var iframeElem = getIframeDimensions(elem);

    if (iframeElem.id == null && childElems != null && childElems.length > 0) {
        // list of excluded containers
        var swiperEl = childElems[0].closest(".swiper-wrapper");
        var instgrmEl = childElems[0].closest(".instgrm-embed");
        var twttrEl = childElems[0].closest(".twitter-container");

        childElems.forEach(item => {
            if (item.nodeName === "IMG" || item.nodeName === "VIDEO") {
                if (childElems.length == 1) {
                    // don't interfere with carousel media settings
                    item.addEventListener("canplaythrough", e => {
                        // autoplay videos (muted) when shown
                        if (e.target.paused) { toggleVideoState(e.target, 1); }
                        if (!e.target.muted) { e.target.muted = true; }
                    });
                }
                else {
                    item.addEventListener('click', e => {
                    // allow toggling play state by clicking the carousel video
                        if (e.target.nodeName === "VIDEO" && !e.target.hasAttribute("controls")) {
                            if (e.target.paused) { e.target.play(); }
                            else { e.target.pause(); }
                        }
                    });
                }

                // don't attach click-to-hide events to excluded containers
                ((swiperEl, instgrmEl, twttrEl) => {
                    item.addEventListener('mousedown', e => {
                        var embed = e.target.parentNode.querySelector(`#loader_${id}-${index}`);
                        var link = getLinkRef(embed);
                        if (e.which === 2 && getSetting("image_loader_newtab")) {
                            e.preventDefault();
                            // pause our current video before re-opening it
                            if (e.target.nodeName === "VIDEO") { e.target.pause(); }
                            // reopen this element in a lightbox overlay
                            insertLightbox(e.target);
                        } else if (e.which === 1 && swiperEl == null && instgrmEl == null && twttrEl == null) {
                            e.preventDefault();
                            // toggle our embed state when non-carousel media embed is left-clicked
                            toggleMediaLink(embed, link);
                        }
                    });
                })(swiperEl, instgrmEl, twttrEl);
            }
        });
    }
}

function triggerReflow(elem) {
    $(elem).ready(function() {
        // trigger a resize via jQuery ready() to recalc the carousel
        var body = document.getElementsByTagName("body")[0];
        insertScript(
            body,
            { code: "window.dispatchEvent(new Event('resize'));" },
            "reflow-wjs",
            true
        );
    });
}
