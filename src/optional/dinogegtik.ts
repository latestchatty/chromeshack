import { parseToElement } from "../core/common/dom";
import { SentenceParser } from "../core/common/sentence_parser";
import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { HighlightUsers } from "../optional/highlight_users";

export const DinoGegtik = {
    panels: [
        { x: 5, y: 5, width: 234, height: 92 },
        { x: 248, y: 5, width: 121, height: 92 },
        { x: 517, y: 5, width: 214, height: 150 },
        { x: 4, y: 246, width: 186, height: 67 },
        { x: 198, y: 246, width: 291, height: 66 },
        { x: 496, y: 246, width: 234, height: 56 },
    ],
    userMatches: {} as ResolvedUsers,

    async install() {
        const is_enabled = await enabledContains(["dinogegtik"]);
        if (is_enabled) processPostEvent.addHandler(DinoGegtik.installComic);
    },

    installComic({ post, rootid }: PostEventArgs) {
        const fullpost = post?.querySelector("div.fullpost") as HTMLDivElement;
        const targetUsernames = ["gegtik", "boring gegtik"];
        DinoGegtik.userMatches = HighlightUsers.resolveUser(targetUsernames);
        // we have a fullpost, and its className contains gegtik's user id
        for (const records of Object.values(DinoGegtik.userMatches)) {
            const match = records?.[0];
            if (fullpost?.classList.contains(`fpauthor_${match.id}`)) {
                const comic_id = `dinogegtik_${rootid}`;
                // comic is already here!
                if (document.getElementById(comic_id)) return;

                const postBody = fullpost?.querySelector("div.postbody") as HTMLDivElement;
                const postBodyClone = postBody?.cloneNode(true) as HTMLElement;
                const lines = SentenceParser.parseIntoLines(postBodyClone?.innerHTML);
                const image = chrome.runtime.getURL("images/dinogegtik.png");
                const comic_height = lines.length <= 3 ? "244px" : "487px";
                const comic_div = parseToElement(/*html*/ `
                    <div id="${comic_id}" class="dinogegtik" style="height: ${comic_height}; background-image: url(${image});" />
                `) as HTMLDivElement;

                const max = lines.length > DinoGegtik.panels.length ? DinoGegtik.panels.length : lines.length;
                for (let i = 0; i < max; i++) {
                    const this_panel = DinoGegtik.panels[i];
                    const parsedPanel = parseToElement(/*html*/ `
                        <div class="panel" style="left: ${this_panel.x}px; top: ${this_panel.y}px; width: ${this_panel.width}px; height: ${this_panel.height}px;">
                            ${lines[i]}
                        </div>
                    `) as HTMLDivElement;
                    comic_div.appendChild(parsedPanel);
                    DinoGegtik.resizePanelText(parsedPanel);
                }

                postBody?.appendChild(comic_div);
            }
        }
    },

    resizePanelText(panel: HTMLDivElement) {
        // the div isn't actually visible yet, so the scroll/client height properties will just be 0
        // just wait a bit to resize the text
        setTimeout(() => {
            let size = 12;
            while (panel?.scrollHeight > panel?.clientHeight && size > 7) {
                panel.style.fontSize = "" + size + "px";
                size--;
            }
        }, 200);
    },
};
