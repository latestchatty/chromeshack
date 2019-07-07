/*
 * This allows Chrome Shack to inject a Swiper carousel for better
 * quality-of-life when viewing posts that contain galleries of media.
 */

var container = document.querySelector(_carouselSelect);
var carouselOpts = {
    autoHeight: true,
    centeredSlides: true,
    slidesPerView: 'auto',
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    on: {
        init: function() {
            var swiperEl = this;
            var wrapper = container.querySelector(".swiper-wrapper");
            var slides = [ ...container.querySelectorAll(".swiper-slide") ];
            if (slides[0].nodeName === "VIDEO") {
                // autoplay if the first slide is a video
                console.log(`Playing initial slide: ${slides[0]}`);
                toggleVideoState(slides[0], { state: true, muted: false });
            }
            let loadedVidFunc = (e) => {
                swiperEl.update();
                triggerReflow(e.target);
                //console.log("Video loaded so we fired off a resize");
                e.target.removeEventListener("load", loadedVidFunc);
            };
            slides.forEach(i => {
                // fire off a reflow when videos load to recalc the carousel
                if (i.nodeName === "VIDEO")
                    i.addEventListener("loadeddata", loadedVidFunc);
            });
        },
        transitionEnd: function() {
            // toggle autoplay on slides as we transition to/from them
            var slides = [ ...container.querySelectorAll(".swiper-slide") ];
            for (let [idx, i] of slides.entries()) {
                if (i.matches("video.swiper-slide-active")) {
                    //console.log(`Playing active slide: ${i.id} @ ${idx}`);
                    toggleVideoState(i, { state: true, muted: false });
                }
                else if (i.matches("video.swiper-slide-prev, video.swiper-slide-next")) {
                    //console.log(`Pausing: ${i.id} @ ${idx}`);
                    toggleVideoState(i, { state: false, muted: true });
                }
            }
        }
    }
};
var swiper = new Swiper(container, carouselOpts);
