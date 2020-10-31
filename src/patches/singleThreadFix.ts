import { scrollToElement } from "../core/common";
import { fullPostsCompletedEvent } from "../core/events";

/*
 *  Fix visible fullpost position when opening a post in single-thread mode
 */
export const singleThreadFix = () => {
    const fix = () => {
        const urlRgx = window.location.href.match(/id=(\d+)#item_(\d+)/);
        const rootid = parseInt(urlRgx?.[1]);
        const postid = parseInt(urlRgx?.[2]);
        const post = rootid === postid && document.getElementById(`item_${postid}`);
        if (post) {
            console.log("scrolling to single-thread:", post);
            scrollToElement(post, { toFit: true });
        }
    };
    fullPostsCompletedEvent.addHandler(fix);
};
