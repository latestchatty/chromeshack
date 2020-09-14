import { DateTime } from "luxon";
import { processPostEvent, processPostRefreshEvent } from "../core/events";

class GetTime {
    static asDate = () => DateTime.local().toJSDate();
    static asString = () => DateTime.local().toLocaleString(DateTime.DATETIME_MED);
    static fromStrToDate = (dateStr: string) => new Date(Date.parse(dateStr));
    static fromDateToString = (jsDate: Date) => DateTime.fromJSDate(jsDate).toLocaleString(DateTime.DATETIME_MED);
}

export const LocalTimeStamp = {
    install() {
        processPostEvent.addHandler(LocalTimeStamp.adjustTime);
        processPostRefreshEvent.addHandler(LocalTimeStamp.adjustTime);
    },

    fixTime(rawDateStr: string) {
        // usually in format: Jan 1, 1976, 12:01am PDST
        // NOTE: The Chatty page can report wrong timestamps due to a nuChatty bug
        const fixAMPM = rawDateStr.replace(/(am\s|pm\s)/, (m1) => ` ${m1.toUpperCase()}`);
        return GetTime.fromDateToString(GetTime.fromStrToDate(fixAMPM));
    },

    adjustTime(item: HTMLElement) {
        const postDate = <HTMLElement>item?.querySelector("div.postdate");
        const dateStr = postDate?.innerText;
        if (dateStr) {
            const localizedTime = LocalTimeStamp.fixTime(dateStr);
            const timestamp = document.createElement("span");
            timestamp.id = "local-time";
            timestamp.innerText = localizedTime;
            // remove only text child of postdate
            for (const c of postDate.childNodes) if (c.nodeType === 3) c.remove();
            if (!postDate.querySelector("#local-time")) postDate.appendChild(timestamp);
        }
    },
};
