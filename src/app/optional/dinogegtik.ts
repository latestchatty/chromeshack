import * as browser from "webextension-polyfill";

import { safeInnerHTML } from "../core/common";
import { enabledContains } from "../core/settings";
import { processPostEvent } from "../core/events";
import { HU_Instance } from "../content";
import SentenceParser from "./sentence_parser";

const DinoGegtik = {
    panels: [
        { x: 5, y: 5, width: 234, height: 92 },
        { x: 248, y: 5, width: 121, height: 92 },
        { x: 517, y: 5, width: 214, height: 150 },
        { x: 4, y: 246, width: 186, height: 67 },
        { x: 198, y: 246, width: 291, height: 66 },
        { x: 496, y: 246, width: 234, height: 56 },
    ],
    userMatches: [],

    async install() {
        return enabledContains("dinogegtik").then((res) => {
            if (res) processPostEvent.addHandler(DinoGegtik.installComic);
        });
    },

    installComic(item, id) {
        const fullpost = item.querySelector("div.fullpost");
        const targetUsernames = ["gegtik", "boring gegtik"];
        DinoGegtik.userMatches = HU_Instance.resolveUsers().filter((x) => targetUsernames.includes(x.name));
        // we have a fullpost, and its className contains gegtik's user id
        for (const match of DinoGegtik.userMatches) {
            if (fullpost?.classList.contains(`fpauthor_${match.id}`)) {
                const comic_id = `dinogegtik_${id}`;
                // comic is already here!
                if (document.getElementById(comic_id)) return;
                const postBody = fullpost.querySelector("div.postbody");
                const postBodyClone = postBody.cloneNode(true);
                const expando = postBodyClone.querySelector("div.expando");
                if (expando) expando.parentNode.removeChild(expando);
                const lines = SentenceParser.parseIntoLines(postBodyClone.innerHTML);
                const comic_div = document.createElement("div");
                comic_div.id = comic_id;
                comic_div.className = "dinogegtik";
                comic_div.style.backgroundImage = `url("${browser.runtime.getURL("../images/dinogegtik.png")}")`;
                comic_div.style.height = lines.length <= 3 ? "244px" : "487px";
                postBody.appendChild(comic_div);
                const max = lines.length > DinoGegtik.panels.length ? DinoGegtik.panels.length : lines.length;
                for (let i = 0; i < max; i++) {
                    const panel = document.createElement("div");
                    panel.className = "panel";
                    panel.style.left = DinoGegtik.panels[i].x + "px";
                    panel.style.top = DinoGegtik.panels[i].y + "px";
                    panel.style.width = DinoGegtik.panels[i].width + "px";
                    panel.style.height = DinoGegtik.panels[i].height + "px";
                    safeInnerHTML(lines[i], panel);
                    comic_div.appendChild(panel);
                    DinoGegtik.resizePanelText(panel);
                }
            }
        }
    },

    resizePanelText(panel) {
        // the div isn't actually visible yet, so the scroll/client height properties will just be 0
        // just wait a bit to resize the text
        setTimeout(() => {
            let size = 12;
            while (panel.scrollHeight > panel.clientHeight && size > 7) {
                panel.style.fontSize = "" + size + "px";
                size--;
            }
        }, 200);
    },
};

export default DinoGegtik;
