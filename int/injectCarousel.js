/*
 * This allows Chrome Shack to inject a Swiper carousel for better
 * quality-of-life when viewing posts that contain galleries of media.
 */

var container = document.querySelector(_carouselSelect);
var carouselOpts = {
    autoHeight: true,
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    },
    on: {
        init() {
            let slides = [...container.querySelectorAll(".swiper-slide")];
            if (slides[0].nodeName === "VIDEO") {
                // autoplay if the first slide is a video
                toggleVideoState(slides[0], { state: true, muted: false });
            } else {
                // workaround for incorrect height calc on first slide
                let wrapper = slides[0].closest(".swiper-wrapper");
                let wrapperHeight = wrapper.style.height.split("px")[0];
                if (wrapperHeight < 50) triggerReflow(slides[0]);
            }
        },
        transitionEnd() {
            // toggle autoplay on slides as we transition to/from them
            let slides = [...container.querySelectorAll(".swiper-slide")];
            for (let slide of slides) {
                if (slide.matches("video.swiper-slide-active")) {
                    toggleVideoState(slide, { state: true, muted: false });
                } else if (slide.matches("video.swiper-slide-prev, video.swiper-slide-next")) {
                    toggleVideoState(slide, { state: false, muted: true });
                }
            }
        }
    }
};
var swiper = new Swiper(container, carouselOpts);
