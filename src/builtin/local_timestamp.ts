import { processPostEvent, processPostRefreshEvent } from "../core/events";

export const LocalTimeStamp = {
    hasLoaded: false,

    install() {
        processPostRefreshEvent.addHandler(LocalTimeStamp.adjustTime);
        processPostEvent.addHandler(LocalTimeStamp.adjustTime);
        LocalTimeStamp.adjustTime();
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
        const textNode = postDate?.childNodes[1];
        if (textNode?.nodeType === 3) textNode.parentNode.replaceChild(timeText, textNode);
    },

    adjustTime(post?: HTMLElement, rootid?: string) {
        // change all visible dates in one large batch
        const postDate = post?.querySelector("div.postdate") as HTMLElement;
        if (postDate && LocalTimeStamp.hasLoaded) {
            const dateStr = postDate?.innerText;
            const fixedTime = LocalTimeStamp.fixTime(dateStr);
            if (fixedTime) {
                LocalTimeStamp.replaceTime(fixedTime, postDate);
                LocalTimeStamp.hasLoaded = false;
            }
            return; // bail
        }

        let dates = [] as HTMLElement[];
        if (rootid) {
            const root = document.getElementById(`item_${rootid}`);
            dates = [...root?.querySelectorAll("div.postdate")] as HTMLElement[];
        } else {
            dates = [...document.querySelectorAll("div.postdate")] as HTMLElement[];
        }
        if (dates) LocalTimeStamp.hasLoaded = true;
        for (const postdate of dates) {
            const dateStr = postdate?.innerText;
            const fixedTime = LocalTimeStamp.fixTime(dateStr);
            if (fixedTime) LocalTimeStamp.replaceTime(fixedTime, postdate);
        }
    },
};
