/*
 * This lib is for injecting a Lightbox upon middle-clicking a piece of media
 * ... inside a post. We also add controls for video elements as a convenience.
 */

let mediaElem = document.createElement("div");
mediaElem.innerHTML = _mediaHTML;
if (mediaElem.firstChild.nodeName === "VIDEO") {
    mediaElem.firstChild.setAttribute("controls", "");
    mediaElem.firstChild.setAttribute("autoplay", "");
    mediaElem.firstChild.removeAttribute("muted");
}
var lightbox = window.basicLightbox.create(mediaElem.firstChild.outerHTML);
lightbox.show();
