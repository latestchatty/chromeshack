/*
 * This allows Chrome Shack to inject a Swiper carousel for better
 * quality-of-life when viewing posts that contain galleries of media.
 */

var container = document.querySelector(_carouselSelect);
var carouselOpts = {
    autoHeight: true,
    centeredSlides: true,
    slidesPerView: "auto",
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    },
    on: {
        init() {
            let swiperEl = this;
            let slides = [...container.querySelectorAll(".swiper-slide")];
            if (slides[0].nodeName === "VIDEO") {
                // autoplay if the first slide is a video
                toggleVideoState(slides[0], { state: true, muted: false });
            }
            let loadedMediaFunc = e => {
                triggerReflow(e.target);
                swiperEl.update();
                e.target.removeEventListener("loadeddata", loadedVidFunc);
                e.target.removeEventListener("loaded", loadedVidFunc);
            };
            slides.forEach(i => {
                // fire off a reflow when videos load to recalc the carousel
                if (i.nodeName === "VIDEO") i.addEventListener("loadeddata", loadedMediaFunc);
                else if (i.nodeName === "IMG") i.addEventListener("loaded", loadedMediaFunc);
            });
        },
        transitionEnd() {
            // toggle autoplay on slides as we transition to/from them
            let slides = [...container.querySelectorAll(".swiper-slide")];
            for (let [idx, i] of slides.entries()) {
                if (i.matches("video.swiper-slide-active")) {
                    toggleVideoState(i, { state: true, muted: false });
                } else if (i.matches("video.swiper-slide-prev, video.swiper-slide-next")) {
                    toggleVideoState(i, { state: false, muted: true });
                }
            }
        }
    }
};
var swiper = new Swiper(container, carouselOpts);
