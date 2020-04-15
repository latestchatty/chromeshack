import * as browser from "webextension-polyfill";

import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { safeInnerHTML } from "../core/common";
import { HU_Instance } from "../content";
import SentenceParser from "../core/sentence_parser";

const SparklyComic = {
    userMatch: null,

    async install() {
        const is_enabled = await enabledContains("sparkly_comic");
        if (is_enabled) processPostEvent.addHandler(SparklyComic.installComic);
    },

    installComic(item, id) {
        const fullpost = item.querySelector("div.fullpost");
        SparklyComic.userMatch = HU_Instance.resolveUsers().filter((x) => x.name === "sparkly")[0];
        // we have a fullpost, and its className contains sparkly's user id
        if (
            fullpost &&
            SparklyComic.userMatch &&
            fullpost.classList.contains(`fpauthor_${SparklyComic.userMatch.id}`)
        ) {
            const comic_id = `sparklycomic_${id}`;
            // comic is already here!
            if (document.getElementById(comic_id)) return;
            const postBody = fullpost.querySelector("div.postbody");
            const postBodyClone = postBody.cloneNode(true);
            const expando = postBodyClone.querySelector("div.expando");
            if (expando) expando.parentNode.removeChild(expando);
            const lines = SentenceParser.parseIntoLines(postBodyClone.innerHTML);
            const comic_div = document.createElement("div");
            comic_div.id = comic_id;
            comic_div.className = "sparklycomic";
            postBody.appendChild(comic_div);
            const max = lines.length;
            for (let i = 0; i < max; i++) {
                const panel = document.createElement("div");
                panel.className = "panel";
                panel.style.backgroundImage = `url("${browser.runtime.getURL(
                    "../images/sparkly/" + SparklyComic.getImage(lines[i], i, max),
                )}")`;
                const s = document.createElement("span");
                safeInnerHTML(lines[i], s);
                panel.appendChild(s);
                comic_div.appendChild(panel);
            }
        }
    },

    getImage(line, i, count) {
        // Let me show you my O face
        if (line.indexOf("!") >= 0 || line.indexOf(":o") >= 0) return "sparkly2.jpg";
        // Sparkly gets mad.  You wouldn't like him when he's mad.
        if (line.indexOf("&gt;:[") >= 0) return "sparkly5.jpg";
        // Sparkly gets sad.  You wouldn't like him when he's sad.
        if (line.indexOf(":(") >= 0 || line.indexOf(":[") >= 0) return "sparkly6.jpg";
        // Que?  wtf?
        if (line.indexOf("?") >= 0 || line.indexOf("wtf") >= 0) return "sparkly4.jpg";
        // LOL or NWS
        if (line.indexOf("lol") >= 0 || line.indexOf("nws") >= 0) return "sparkly3.jpg";
        // end on a smile
        if (i === count - 1) return "sparkly3.jpg";
        // default sparkly
        return "sparkly1.jpg";
    },
};

export default SparklyComic;
