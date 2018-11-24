/*
    Helper functions for responsive image/video support
*/

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

function toggleMediaItem(link, postBodyElem, postId, index) {
    // abstracted helper for toggling media container items from a link/expando
    var _expandoClicked = link.classList !== undefined && link.classList.contains("expando");
    var _embedExists = postBodyElem.querySelector(`#loader_${postId}-${index}`) ||
                        postBodyElem.querySelector(`#instgrm-container_${postId}-${index}`) ||
                        postBodyElem.querySelector(`#tweet-container_${postId}-${index}`);
    var _expando = postBodyElem.querySelector(`#expando_${postId}-${index}`);

    // pretty aggressive way to handle stopping an iframe player when toggling the container
    var encapMedia = postBodyElem.querySelector(`#iframe_${postId}-${index}`) ||
                    postBodyElem.querySelector(`#loader_${postId}-${index}.tweet-container`);
    if (encapMedia) {
        var mediaParent = encapMedia.parentNode.parentNode;
        var container = mediaParent.parentNode;
        // make sure we remove both child and spacer
        container.removeChild(mediaParent);
    }

    // state toggle our various embed children
    toggleVideoState(_embedExists);
    if (_embedExists && _expando) { toggleExpandoButton(_expando); }
    if (_embedExists && _expandoClicked) {
        link.parentNode.classList.toggle("embedded");
        _embedExists.classList.toggle("hidden");
        return true;
    } else if (_embedExists) {
        link.classList.toggle("embedded");
        _embedExists.classList.toggle("hidden");
        return true;
    }

    return false;
}

function insertCommand(elem, injectable) {
    // insert a one-way script that executes synchronously (caution!)
    var _script = document.createElement("script");
    _script.textContent = `${injectable}`;
    elem.appendChild(_script);
}

function setLimiter(linkElem) {
    // provides rate limiting to prevent mouse click race conditions
    if (!linkElem.dataset.clicked)
        linkElem.dataset.clicked = true;
    // ^ this gets changed on the element in mediaContainerInsert
}

function mediaContainerInsert(elem, link, id, index, width, height) {
    function unsetLimiter() {
        if (link.dataset.clicked)
            link.dataset.clicked = false;
    }
    // abstracted helper for manipulating the media-container grid from a post
    var container = link.parentNode.querySelector(".media-container");
    var expando = link.querySelector(`#expando_${id}-${index}`);
    if (!container) {
        // generate container if necessary
        container = document.createElement("div");
        container.setAttribute("class", "media-container");
    }

    // make sure we set the play state when our video elements load
    if (elem && elem.nodeName === "VIDEO") {
        elem.addEventListener("canplaythrough", (e) => {
            if (e.target.paused) { toggleVideoState(e.target, 1); }
            if (!e.target.muted) { e.target.muted = true; }
        })
    }

    // use our width passed from 'video_loader' to mutate this media container for HD video
    if (width != null) {
        elem.style.flex = `0 0 ${width}px`;
        elem.style.minHeight = `${height}px`;
    }

    (() => {
        var _twttr = elem && elem.querySelector(".tweet-container") ||
            (elem.classList != null && elem.classList.contains("tweet-container"));
        var _twitch = elem && elem.querySelector(".twitch-container") ||
            (elem.classList != null && elem.classList.contains("twitch-container"));
        if (!_twttr && !_twitch) {
            elem.addEventListener('mousedown', e => {
                var embed = e.target.parentNode.querySelector(`#loader_${id}-${index}`);
                if (e.which === 2 && getSetting("image_loader_newtab")) {
                    e.preventDefault();
                    // open this link in a new window/tab when middle-clicked
                    window.open(embed.src);
                    unsetLimiter();
                } else if (e.which === 1) {
                    e.preventDefault();
                    // toggle our embed state when image embed is left-clicked
                    link.classList.toggle("embedded"); // toggle highlight
                    toggleVideoState(embed);
                    elem.classList.toggle("hidden");
                    toggleExpandoButton(expando);
                    unsetLimiter();
                }
            });
        }
    })();

    container.appendChild(elem);
    link.classList.add("embedded");
    toggleExpandoButton(expando);
    link.parentNode.appendChild(container);
    unsetLimiter();
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

