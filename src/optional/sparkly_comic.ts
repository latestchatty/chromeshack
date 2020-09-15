import { browser } from "webextension-polyfill-ts";
import { HU_Instance } from "../content";
import { safeInnerHTML } from "../core/common";
import { processPostEvent } from "../core/events";
import { SentenceParser } from "../core/sentence_parser";
import { enabledContains } from "../core/settings";
import { ResolvedUser } from "./highlight_users";

export const SparklyComic = {
    userMatch: [] as ResolvedUser[],

    async install() {
        const is_enabled = await enabledContains("sparkly_comic");
        if (is_enabled) processPostEvent.addHandler(SparklyComic.installComic);
    },

    installComic(item: HTMLElement, id: string) {
        const fullpost = item?.querySelector("div.fullpost") as HTMLDivElement;
        const targetUsernames = ["sparkly"];
        SparklyComic.userMatch = HU_Instance.resolveUsers().filter((x) => targetUsernames.includes(x.name));
        // we have a fullpost, and its className contains sparkly's user id
        for (const match of SparklyComic.userMatch)
            if (fullpost?.classList?.contains(`fpauthor_${match.id}`)) {
                const comic_id = `sparklycomic_${id}`;
                // comic is already here!
                if (document.getElementById(comic_id)) return;

                const postBody = fullpost?.querySelector("div.postbody") as HTMLElement;
                const postBodyClone = postBody?.cloneNode(true) as HTMLElement;
                const expando = postBodyClone?.querySelector("div.expando") as HTMLElement;

                if (expando) expando?.parentNode?.removeChild(expando);
                const lines = SentenceParser.parseIntoLines(postBodyClone?.innerHTML);
                const comic_div = document.createElement("div");
                comic_div.id = comic_id;
                comic_div.className = "sparklycomic";
                postBody.appendChild(comic_div);

                for (let i = 0; i < lines?.length; i++) {
                    const panel = document.createElement("div");
                    panel.className = "panel";
                    panel.style.backgroundImage = `url("${browser.runtime.getURL(
                        "images/" + SparklyComic.getImage(lines[i], i, lines.length),
                    )}")`;
                    const s = document.createElement("span");
                    safeInnerHTML(lines[i], s);
                    panel.appendChild(s);
                    comic_div.appendChild(panel);
                }
            }
    },

    getImage(line: string, i: number, count: number) {
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
