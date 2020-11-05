import React from "react";
import { render } from "react-dom";
import { enabledContains } from "../../core/settings";
import { HighlightPendingApp } from "./HighlightPendingApp";
import "../../styles/highlight_pending.css";
import fastdom from "fastdom";

export interface PendingPost {
    postId: number;
    threadId: number;
    thread: HTMLElement;
}

const HighlightPendingPosts = {
    async install() {
        const isEnabled = await enabledContains(["highlight_pending_new_posts"]);
        const selectedPage = document.querySelector("a.selected_page") as HTMLAnchorElement;
        const isFirstPage = selectedPage?.href?.match(/page=1$/i);
        const isChatty = !!(document.getElementById("newcommentbutton") && isFirstPage);
        const container = document.querySelector("#hpnp__app__container");
        const positionElem = document.querySelector(".header-bottom .logo.alt > a");
        fastdom.mutate(() => {
            if (isEnabled && !container && positionElem) {
                const appContainer = document.createElement("div");
                appContainer.setAttribute("id", "hpnp__app__container");
                render(<HighlightPendingApp threaded={isChatty} />, appContainer);
                // put our HPNP app next to the Shacknews logo in the top-left
                positionElem.classList?.add("hpnp__enabled");
                positionElem.appendChild(appContainer);
            }
        });
    },
};

export { HighlightPendingPosts };
