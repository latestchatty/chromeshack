import * as browser from "webextension-polyfill";
import { objContains } from "./common";
import { settingsContains } from "./settings";

/*
 *  Resolvers
 */

export const getEmbedInfo = (link) => {
    // resolves the postId and index of a link
    if (!link) return;
    let _link = link.querySelector("div.expando");
    let _linkInfo = _link && _link.id.split(/[_-]/);
    if (_linkInfo && _linkInfo?.length > 1) {
        let _id = _linkInfo[1];
        let _idx = _linkInfo[2];
        return { id: _id, index: _idx };
    }
};

export const getLinkRef = (embed) => {
    // resolves the link of an embed in a postBody
    if (!embed) return;
    let _embedInfo = embed.id.split(/[_-]/);
    if (_embedInfo.length > 1) {
        let _linkRef = document.querySelector(`div[id^='expando_${_embedInfo[1]}-${_embedInfo[2]}']`);
        return _linkRef.parentNode;
    }
};

export const getEmbedRef = (link) => {
    // resolves the embed associated with a link (if any exist)
    if (link == null) return;
    let infoObj = getEmbedInfo(link);
    if (infoObj && infoObj.id && infoObj.index) {
        return document.querySelector(`
            #medialoader_${infoObj.id}-${infoObj.index},
            #iframe_${infoObj.id}-${infoObj.index},
            #loader_${infoObj.id}-${infoObj.index},
            #getpost_${infoObj.id}-${infoObj.index}
        `);
    }
    return null;
};

/*
 *  State Transition Toggles
 */
export const toggleVideoState = (elem, stateObj?) => {
    const play = () => {
        video.currentTime = 0;
        video.play();
    };
    const pause = () => {
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

    if ((video && (state || mute)) || (video && !objContains("hidden", video.closest(".media-container").classList))) {
        if (state) play();
        else if (!excludedParent && video.paused) play();
        else pause();

        if (!mute || video.muted) video.muted = false;
        else video.muted = true;
    }
};

export const toggleExpandoButton = (expando) => {
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

export const toggleMediaItem = (link) => {
    // abstracted helper for toggling media container items
    let expando = link.querySelector("div.expando");
    let embed = getEmbedRef(link);
    if (!embed) return;
    let container = embed.closest(".media-container");
    if (expando.matches(".embedded") && embed && embed.matches(".iframe-spacer")) {
        // remove iframe directly to toggle media
        container.parentNode.removeChild(container);
        expando.classList.remove("embedded");
        toggleExpandoButton(link.querySelector("div.expando"));
        return true;
    } else if (embed) {
        // just toggle the container  and link state
        if (!expando.matches(".embedded")) expando.classList.add("embedded");
        if (container?.childElementCount > 1) {
            if (container.matches(".hidden")) container.classList.remove("hidden");
            else {
                // toggle multiple children of placed media container (Twitter)
                for (let child of container.children || []) {
                    if (child.matches(".hidden")) child.classList.remove("hidden");
                    else child.classList.add("hidden");
                }
            }
        } else if (embed.matches("div")) {
            if (embed.matches(".hidden")) embed.classList.remove("hidden");
            else if (embed.matches("div")) embed.classList.add("hidden");
        } else if (container) {
            if (container.matches(".hidden")) container.classList.remove("hidden");
            else container.classList.add("hidden");
        }
        toggleVideoState(embed);
        toggleExpandoButton(link.querySelector("div.expando"));
        return true;
    }
    return false;
};

/*
 *  Media Insertion Functions
 */

export const mediaContainerInsert = (elem, link, id, index) => {
    // abstracted helper for manipulating the media-container grid from a post
    let expando = link.querySelector("div.expando");
    let hasMedia = expando.matches(".embedded");
    if (hasMedia) return toggleMediaItem(link);
    attachChildEvents(elem, id, index);
    // always insert media embeds next to their expando
    if (link.nextSibling) link.parentNode.insertBefore(elem, link.nextSibling);
    else link.parentNode.appendChild(elem);
    toggleMediaItem(link);
};

export const createMediaElem = (href, postId, index, override?) => {
    let _animExt = /\.(mp4|gifv|webm)|(mp4|webm)$/i.test(href);
    let _staticExt = /\.(jpe?g|gif|png)/i.test(href);
    let mediaElem: HTMLElement;
    if (_animExt) {
        mediaElem = document.createElement("video");
        if (!override) mediaElem.setAttribute("loop", "");
        else mediaElem.setAttribute("controls", ""); // for Instagram/Twitter
    } else if (_staticExt) mediaElem = document.createElement("img");

    if (mediaElem) {
        mediaElem.setAttribute("id", `loader_${postId}-${index}`);
        mediaElem.setAttribute("src", href);
        return mediaElem;
    }
    return null;
};

export const createIframe = (src, type, postId, index) => {
    if (src && src.length > 0) {
        let video = document.createElement("div");
        let spacer = document.createElement("div");
        let iframe = document.createElement("iframe");
        spacer.setAttribute("class", "iframe-spacer hidden");
        spacer.setAttribute("id", `loader_${postId}-${index}`);

        if (type === 1) {
            video.setAttribute("class", "yt-container"); // Youtube
            iframe.setAttribute("allow", "autoplay; encrypted-media");
        } else if (type === 2) video.setAttribute("class", "twitch-container");
        // Twitch
        else if (type === 3 || type === 4 || type === 5) {
            video.setAttribute("class", "iframe-container"); // Streamable / XboxDVR
            iframe.setAttribute("scale", "tofit");
        }

        iframe.setAttribute("id", `iframe_${postId}-${index}`);
        iframe.setAttribute("src", src);
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("allowfullscreen", "");
        video.appendChild(iframe);
        spacer.appendChild(video);
        return spacer;
    }
    return null;
};

export const appendMedia = ({ src, link, postId, index, type }) => {
    // compile our media items into a given container element
    // overrides include: forceAppend, twttrEmbed, and instgrmEmbed
    let mediaElem = document.createElement("div");
    mediaElem.setAttribute("class", "media-container");
    let { forceAppend, twttrEmbed, instgrmEmbed, iframeEmbed } = type || {};
    if (Array.isArray(src) && src.length > 0) {
        let nodeList = [];
        for (let item of src) {
            if (iframeEmbed) nodeList.push(createIframe(src, iframeEmbed.type, postId, index));
            else if (instgrmEmbed || twttrEmbed) nodeList.push(createMediaElem(item, postId, index, true));
            else nodeList.push(createMediaElem(item, postId, index));
        }
        for (let node of nodeList) mediaElem.appendChild(<HTMLElement>node);
        // only use carousel if we have multiple items
        if (nodeList.length > 1) mediaElem.setAttribute("id", `medialoader_${postId}-${index}`);
        // TODO: FIX CAROUSEL
        //mediaElem = insertCarousel(mediaElem);
    } else throw Error("Media array must contain at least one item!");

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

export const insertScript = (options) => {
    let { elem, filePath, code, id, overwrite } = options;
    // insert a script that executes synchronously (caution!)
    let _elem = elem ? elem : document.getElementsByTagName("head")[0];
    let _script = document.getElementById(id);
    if (id && !overwrite && document.getElementById(id)) return;
    else if (overwrite && _script) _script.parentNode.removeChild(_script);
    _script = document.createElement("script");
    if (id) _script.setAttribute("id", id);
    if (code && code.length > 0) _script.textContent = code;
    else if (filePath && filePath.length > 0) _script.setAttribute("src", browser.runtime.getURL(filePath));
    else throw Error("Must pass a file path or code content in string format!");
    _elem.appendChild(_script);
};

export const createExpandoButton = (link, postId, index) => {
    // abstracted helper for appending an expando button to a link in a post
    if (link.querySelector("div.expando")) return;
    // process a link into a link container that includes a dynamic styled "button"
    let expando = document.createElement("div");
    expando.classList.add("expando");
    expando.id = `expando_${postId}-${index}`;
    expando.style.fontFamily = "Icon";
    expando.innerText = "\ue907";
    link.appendChild(expando);
};

export const processExpandoLinks = (linksArr, linkParser, postProcesser) => {
    for (let idx = 0; idx < linksArr.length; idx++) {
        let link = linksArr[idx];
        let parsed = linkParser(link.href);
        if (parsed) {
            ((parsed, idx) => {
                if (link.querySelector("div.expando")) return;
                link.addEventListener("click", (e) => {
                    postProcesser(e, parsed, postId, idx);
                });
                let postBody = link.closest(".postbody");
                let postId = postBody.closest("li[id^='item_']").id.substr(5);
                createExpandoButton(link, postId, idx);
            })(parsed, idx);
        }
    }
};

export const attachChildEvents = async (elem, id, index) => {
    let childElems = Array.from(elem.querySelectorAll("video[id*='loader'], img[id*='loader']"));
    let iframeElem = elem.querySelector("iframe");
    if (!iframeElem && childElems && childElems.length > 0) {
        // list of excluded containers
        let first_elem = <HTMLElement>childElems[0];
        let swiperEl = first_elem.closest(".swiper-wrapper");
        let instgrmEl = first_elem.closest(".instgrm-embed");
        let twttrEl = first_elem.closest(".twitter-container");
        let lightboxed = await settingsContains("image_loader_newtab");
        for (let item of childElems) {
            let this_elem = <HTMLElement>item;
            if (this_elem.nodeName === "IMG" || this_elem.nodeName === "VIDEO") {
                if (childElems.length == 1) {
                    // don't interfere with carousel media settings
                    const canPlayCallback = (e) => {
                        // autoplay videos (muted) when shown (except for social embeds)
                        if (
                            !e.target.hasAttribute("initialPlay") &&
                            !e.target.closest(".twitter-container, .instgrm-embed")
                        ) {
                            e.target.setAttribute("initialPlay", "");
                            toggleVideoState(e.target, {
                                state: true,
                                mute: true,
                            });
                            // unsubscribe to avoid retriggering after video loads
                            e.target.removeEventListener("canplaythrough", canPlayCallback);
                        }
                    };
                    this_elem.addEventListener("canplaythrough", canPlayCallback);
                } else {
                    this_elem.addEventListener("click", (e) => {
                        // allow toggling play state by clicking the carousel video
                        if (
                            (<HTMLElement>e.target).nodeName === "VIDEO" &&
                            !(<HTMLElement>e.target).hasAttribute("controls")
                        )
                            toggleVideoState(e.target);
                    });
                }
                // don't attach click-to-hide events to excluded containers
                ((swiperEl, instgrmEl, twttrEl, lightboxed) => {
                    this_elem.addEventListener("mousedown", (e) => {
                        let elem = <HTMLElement>e.target;
                        let embed = elem.parentNode.querySelector(`#loader_${id}-${index}`);
                        let link = getLinkRef(embed);
                        /* if (e.which === 2 && lightboxed) {
                            e.preventDefault();
                            // pause our current video before re-opening it
                            if (elem.nodeName === "VIDEO") toggleVideoState(elem, { state: false });
                            // reopen this element in a lightbox overlay
                            insertLightbox(elem); // TODO: FIX LIGHTBOX
                            return false;
                        } else */
                        if (e.which === 1 && !swiperEl && !instgrmEl && !twttrEl) {
                            e.preventDefault();
                            // toggle our embed state when non-carousel media embed is left-clicked
                            toggleMediaItem(link);
                        }
                    });
                })(swiperEl, instgrmEl, twttrEl, lightboxed);
            }
        }
    }
};
