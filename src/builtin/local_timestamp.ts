import { arrHas } from "../core/common";
import { processPostEvent, processPostRefreshEvent } from "../core/events";
import type { PostEventArgs } from "../core/index.d";

export const LocalTimeStamp = {
    hasLoaded: false,

    install() {
        processPostRefreshEvent.addHandler(LocalTimeStamp.adjustTime);
        processPostEvent.addHandler(LocalTimeStamp.adjustTime);
        LocalTimeStamp.batchAdjustTime();
    },

    fixTime(rawDateStr: string) {
        // from: Sep 16, 2020 5:24pm PDT (server)
        // to: Sep 16, 2020, 6:24PM MDT (client)
        // NOTE: The Chatty page can report wrong timestamps due to a backend server bug
        try {
            const fixAMPM = rawDateStr.replace(/(am\s|pm\s)/, (m1) => ` ${m1.toUpperCase()}`);
            const toDT = new Date(fixAMPM);
            // use native JS to format a date string
            const toStr = toDT.toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                timeZoneName: "short",
            });
            return toStr ? toStr : rawDateStr;
        } catch (e) {
            console.error(e);
        }
    },

    replaceTime(dateStr: string, postDate: HTMLElement) {
        const timeText = document.createTextNode(dateStr);
        // either a fullpost with a timer or a reply without one
        const textNode = postDate?.childNodes[1] || postDate?.childNodes[0];
        if (textNode?.nodeType === 3) textNode.parentNode.replaceChild(timeText, textNode);
    },

    adjustPostTime({ post }: PostEventArgs) {
        const dateStr = post?.textContent;
        const fixedTime = dateStr && LocalTimeStamp.fixTime(dateStr);
        const is_corrected = post?.classList?.contains("timestamp_corrected");
        if (fixedTime && !is_corrected) {
            LocalTimeStamp.replaceTime(fixedTime, post);
            post.classList?.add("timestamp_corrected");
        }
    },

    batchAdjustTime() {
        const postDates = document.getElementsByClassName("postdate");
        for (const date of postDates || []) LocalTimeStamp.adjustPostTime({ post: <HTMLElement>date });
        LocalTimeStamp.hasLoaded = true;
    },

    adjustTime({ post, root }: PostEventArgs) {
        // change dates per given root
        let dates = [] as HTMLElement[];

        if (post) dates = [...post.getElementsByClassName("postdate")] as HTMLElement[];
        else if (root) dates = [...root.getElementsByClassName("postdate")] as HTMLElement[];

        if ((arrHas(dates) && LocalTimeStamp.hasLoaded) || post) {
            for (const postdate of dates || []) LocalTimeStamp.adjustPostTime({ post: <HTMLElement>postdate });
            LocalTimeStamp.hasLoaded = false;
        }
    },
};
