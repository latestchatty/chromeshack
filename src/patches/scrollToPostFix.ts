import { elementIsVisible, scrollToElement } from "../core/common/dom";
import { fullPostsCompletedEvent, processPostEvent, processUncapThreadEvent } from "../core/events";

/*
 *  Workaround for busted scroll-to-post in clickItem() when uncapping root posts
 */
export const scrollToUncappedPostFix = () => {
    let uncapped: number = -1;

    const detect = ({ root, rootid }: UncapThreadEventArgs) => {
        if (root != undefined) uncapped = rootid;
    };
    const fix = ({ post, rootid }: PostEventArgs) => {
        if (uncapped === rootid && !elementIsVisible(post)) {
            // scroll-to-post when uncapping a thread
            console.log("scrollToUncappedPostFix thread:", post, rootid, uncapped);
            scrollToElement(post, { toFit: true });
        } else if (!elementIsVisible(post, true)) {
            // try to scroll-to-post when an opened fullpost is offscreen
            console.log("scrollToUncappedPostFix post:", post, rootid, uncapped);
            scrollToElement(post);
        }
    };
    const install = () => {
        const isChatty = document.getElementById("newcommentbutton");
        if (!isChatty) return;

        processUncapThreadEvent.addHandler(detect);
        processPostEvent.addHandler(fix);
    };

    fullPostsCompletedEvent.addHandler(install);
};
