import { scrollToElement } from "../core/common";

/*
 *  Fix visible fullpost position when opening a post in single-thread mode
 */
export const singleThreadFix = () => {
    const fix = () => {
        const urlRgx = window.location.href.match(/#item_(\d+)/);
        const postid = urlRgx && urlRgx[1];
        const post = document.getElementById(`item_${postid}`);
        setTimeout(() => {
            if (post) {
                console.log("scrolling to single-thread:", post);
                scrollToElement(post, { toFit: true });
            }
        }, 0);
        window.removeEventListener("load", fix);
    };
    window.addEventListener("load", fix);
};
