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
            console.log("scrollToUncappedPostFix:", post, rootid, uncapped);
            scrollToElement(post, { toFit: true });
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
