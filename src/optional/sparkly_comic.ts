import browser from "webextension-polyfill";
import { parseToElement } from "../core/common/dom";
import { SentenceParser } from "../core/common/sentence_parser";
import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { HighlightUsers } from "../optional/highlight_users";

export const SparklyComic = {
    userMatch: {} as ResolvedUsers,

    async install() {
        const is_enabled = await enabledContains(["sparkly_comic"]);
        if (is_enabled) processPostEvent.addHandler(SparklyComic.installComic);
    },

    installComic({ post, postid }: PostEventArgs) {
        const fullpost = post?.querySelector("div.fullpost") as HTMLDivElement;
        SparklyComic.userMatch = HighlightUsers.resolveUser(["sparkly"]);
        // we have a fullpost, and its className contains sparkly's user id
        for (const records of Object.values(SparklyComic.userMatch) || []) {
            const match = records?.[0];
            if (match && fullpost?.classList?.contains(`fpauthor_${match.id}`)) {
                const comic_id = `sparklycomic_${postid}`;
                // comic is already here!
                if (document.getElementById(comic_id)) return;

                const postBody = fullpost?.querySelector("div.postbody") as HTMLElement;
                const postBodyClone = postBody?.cloneNode(true) as HTMLElement;
                const lines = SentenceParser.parseIntoLines(postBodyClone?.innerHTML);
                const comic_div = parseToElement(/*html*/ `<div id="${comic_id}" class="sparklycomic" />`);

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const image = browser.runtime.getURL(`images/${SparklyComic.getImage(line, i, lines.length)}`);
                    const panel = parseToElement(/*html*/ `
                        <div class="panel" style="background-image: url(${image});">
                            <span>${line}</span>
                        </div>
                    `);
                    comic_div.appendChild(panel);
                }

                postBody.appendChild(comic_div);
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
