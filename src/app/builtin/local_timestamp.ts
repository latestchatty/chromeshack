import * as luxon from "luxon";
import { processPostEvent, processPostRefreshEvent } from "../core/events";

const LocalTimeStamp = {
    install() {
        processPostEvent.addHandler(LocalTimeStamp.adjustTime);
        processPostRefreshEvent.addHandler(LocalTimeStamp.fixReplyTime);
    },

    parseTime(elm) {
        let date = new Date();
        let dstr = elm.innerText.toUpperCase();
        let pos = dstr.indexOf("AM") + dstr.indexOf("PM") + 1;
        dstr = dstr.substring(0, pos) + " " + dstr.substr(pos);
        date.setTime(Date.parse(dstr));
        let lx = luxon.DateTime.fromISO(date.toISOString());
        let result = lx.toLocaleString(luxon.DateTime.DATETIME_MED);
        return result; // try to respect localization
    },

    fixReplyTime(item) {
        // the server reports a backwards timezone offset so let's try to fix it
        let elm = item.querySelector("div.postdate");
        if (elm) {
            let dstr = elm.innerText.toUpperCase().split(" PST");
            elm.innerText = `${dstr[0]} UTC+1`;
            LocalTimeStamp.adjustTime(item);
        }
    },

    adjustTime(item) {
        let elm = item.querySelector("div.postdate");
        if (elm) {
            let nuTime = LocalTimeStamp.parseTime(elm);
            let timestamp = document.createElement("span");
            timestamp.id = "local-time";
            timestamp.innerText = nuTime;

            // remove only text child of postdate
            for (let c of elm.childNodes) if (c.nodeType === 3) c.remove();

            if (!elm.querySelector("#local-time")) elm.appendChild(timestamp);
        }
    },
};

export default LocalTimeStamp;
