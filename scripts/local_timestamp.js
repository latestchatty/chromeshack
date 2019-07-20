let LocalTimeStamp = {
    //TODO: convert this into a setting later
    timeAmPm: true,

    convertTime(item, id) {
        let postdate = getDescendentByTagAndClassName(item, "div", "postdate");
        LocalTimeStamp.adjustTime(postdate);
    },

    adjustTime(elm) {
        let date = new Date();
        let dstr = elm.innerText.toUpperCase();
        let pos = dstr.indexOf("AM") + dstr.indexOf("PM") + 1;
        dstr = dstr.substring(0, pos) + " " + dstr.substr(pos);

        date.setTime(Date.parse(dstr));
        let tz = date.toLocaleString();
        pos = tz.indexOf("(");
        if (pos > 0) {
            tz = LocalTimeStamp.formatTimezone(tz.substring(pos + 1, tz.length - 1));
        } else {
            tz = "";
        }

        let dd = date.toDateString();
        let dt = date.toLocaleTimeString();

        if (LocalTimeStamp.timeAmPm) {
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let suffix = "am";
            if (hours >= 12) {
                suffix = "pm";
                hours = hours - 12;
            }
            if (hours == 0) {
                hours = 12;
            }
            if (minutes < 10) minutes = "0" + minutes;
            dt = hours + ":" + minutes + " " + suffix;
        }

        let timestamp = document.createElement("span");
        timestamp.id = "local-time";
        timestamp.innerText = `${dd} ${dt} ${tz}`;
        // remove only text child of postdate
        for (let c of elm.childNodes) {
            if (c.nodeType === 3) {
                c.remove();
            }
        }
        if (!elm.querySelector("#local-time")) elm.appendChild(timestamp);
    },

    formatTimezone(tz) {
        let timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
        let timezoneClip = /[^-+\dA-Z]/g;

        return (tz.match(timezone) || [""]).pop().replace(timezoneClip, "");
    }
};

processPostEvent.addHandler(LocalTimeStamp.convertTime);
