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
                    elem.querySelector(".instgrm-container video") ||
                    (elem.classList != null && elem.classList.contains("tweet-container") && elem);
    var _width = _ref && _ref.width != null && _ref.width;
    var _height = _ref && _ref.height != null && _ref.height;
    return { width: _width, height: _height, ref: _ref };
}


/*
 *  State Transition Toggles
 */

function toggleMediaItem(link) {
    // abstracted helper for toggling media container items from a link/expando
    var _isExpando = link.classList != null && link.classList.contains("expando");
    var _postBody = _isExpando ? link.parentNode.parentNode : link.parentNode;
    var container = _postBody.querySelector(".media-container");
    var _embed = getEmbedRef(link);

    // pretty aggressive way to handle stopping an iframe player when toggling the container
    var encapMediaObj = getIframeDimensions(_embed);
    if (encapMediaObj && encapMediaObj.ref) {
        // remove our media child if it contains a video element otherwise allow toggle("hidden")
        var embed = (encapMediaObj.ref.parentNode.parentNode.classList.contains("iframe-spacer") ||
                    encapMediaObj.ref.parentNode.parentNode.classList.contains("instgrm-container")) ?
                    encapMediaObj.ref.parentNode.parentNode : encapMediaObj.ref;
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
        return true;
    }
    else if (embedElem) {
        if (embedElem.nodeName === "IMG" || embedElem.nodeName === "VIDEO" ||
            embedElem.classList.contains("yt-container") ||
            embedElem.classList.contains("twitch-container") ||
            embedElem.classList.contains("iframe-container"))
            embedElem.parentNode.classList.toggle("hidden");
        else
            embedElem.classList.toggle("hidden");
        toggleVideoState(embedElem);
        link.classList.toggle("embedded");
        toggleExpandoButton(_expando);
        return true;
    }
    return false;
}

function toggleVideoState(elem, override) {
    // abstracted helper for toggling html5 video embed pause state (based on audio)
    if (elem == null) return;
    var video = elem.nodeName === "VIDEO" ? elem : elem.querySelector("video");
    if (override || video && !video.classList.contains("hidden")) {
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
    if (expando && !expando.classList.contains("collapso")) {
        // override is the expando 'button' element
        expando.innerText = "\ue90d"; // circle-arrow-down
        return expando.classList.add("collapso");
    } else if (expando) {
        expando.innerText = "\ue907"; // circle-arrow-up
        return expando.classList.remove("collapso");
    }
}


/*
 *  Misc. Functions
 */

function mediaContainerInsert(elem, link, id, index) {
    // abstracted helper for manipulating the media-container grid from a post
    var container = link.parentNode.querySelector(".media-container");
    var _hasMedia = container !== null && getEmbedRef(link);
    var _isExpando = link.classList != null && link.classList.contains("expando");
    var _postBody = _isExpando ? link.parentNode.parentNode : link.parentNode;
    if (_hasMedia) { return toggleMediaLink(_hasMedia, link); }
    else if (!container) {
        container = document.createElement("div");
        container.setAttribute("class", "media-container");
    }

    attachChildEvents(elem, id, index);
    container.appendChild(elem);
    if (!_hasMedia) { _postBody.appendChild(container); }
    container = link.parentNode.querySelector(".media-container");
    elem = container.querySelector(`[id$='_${id}-${index}']`);
    toggleMediaLink(elem, link);
}

function insertCommand(elem, injectable) {
    // insert a one-way script that executes synchronously (caution!)
    var _script = document.createElement("script");
    _script.textContent = `${injectable}`;
    elem.appendChild(_script);
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
        if (nodeList.length > 1) { insertCarousel(mediaElem); }
    } else if (src != null && src.length > 0) {
        mediaElem.appendChild(createMediaElem(src, postId, index));
    }
    // only append if we're not being called to return an element
    if (!override) {
        mediaElem.setAttribute("class", "medialoader hidden");
        mediaContainerInsert(mediaElem, link, postId, index);
    } else if (container != null) {
        // append to the given container if enabled (alternate style)
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

function attachChildEvents(elem, id, index) {
    var childElem = elem.querySelector("img") || elem.querySelector("video");
    var iframeElem = getIframeDimensions(elem);

    if (iframeElem.id == null && childElem != null) {
        if (childElem && childElem.nodeName === "VIDEO") {
            // make sure to toggle the video state on visible media
            childElem.addEventListener("canplaythrough", e => {
                if (e.target.paused) { toggleVideoState(e.target, 1); }
                if (!e.target.muted) { e.target.muted = true; }
            });
        }
        if (childElem && childElem.nodeName === "IMG" || childElem.nodeName === "VIDEO") {
            // only apply click events on video and img elements (for edge case sanity)
            childElem.addEventListener('mousedown', e => {
                var embed = e.target.parentNode.querySelector(`#loader_${id}-${index}`);
                var link = getLinkRef(embed);
                if (e.which === 2 && getSetting("image_loader_newtab")) {
                    e.preventDefault();
                    // open this link in a new window/tab when middle-clicked
                    window.open(embed.src);
                } else if (e.which === 1) {
                    e.preventDefault();
                    // toggle our embed state when image embed is left-clicked
                    toggleMediaLink(embed, link);
                }
            });
        }
    }
}
