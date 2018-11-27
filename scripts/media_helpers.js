/*
 *  Resolvers
 */

function getEmbedInfo(elem) {
    // resolves the postId and index of a link or embed
    if (elem == null) return;
    var _ref = elem.querySelector(".expando") ||
                elem.querySelector(".imageloader img") ||
                elem.querySelector(".imageloader video") ||
                elem.querySelector(".iframe-container iframe") ||
                elem.querySelector(".tweet-container iframe") ||
                elem.querySelector(".instgrm-container") ||
                elem.querySelector(".yt-container iframe") ||
                elem.querySelector(".twitch-container iframe");
    if (_ref == null) return;
    var split = _ref.id.split(/[\_\-]/);

    var _id = split[1];
    var _idx = split[2];
    return {
        id: _id,
        index: _idx
    };
}

function getLinkRef(embed) {
    // resolves the expando of an embed in a postBody
    if (embed == null) return;
    var infoObj = getEmbedInfo(embed);
    // every handled embed link has a unique expando by id + index
    return document.querySelector(`.postbody div[id^='expando_${infoObj.id}-${infoObj.index}']`);
}

function getEmbedRef(link) {
    // resolves the embed associated with a link (if any exist)
    if (link == null) return;
    var infoObj = getEmbedInfo(link);
    // every link returns a unique embed object by id + index
    var retRef = document.querySelector(`.media-container [id$='_${infoObj.id}-${infoObj.index}']`);
    return retRef;
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
                var link = getLinkRef(embed.parentNode);
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
