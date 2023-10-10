import React from "react";
import { createRoot } from "react-dom/client";
import { parseToElement } from "../../core/common/dom";
import { processPostBoxEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import "../../styles/drafts.css";
import { DraftsApp } from "./DraftsApp";

const Drafts = {
    cachedEl: null as HTMLElement,

    install() {
        processPostBoxEvent.addHandler(Drafts.apply);
        Drafts.cacheInjectables();
    },

    cacheInjectables() {
        const appContainer = parseToElement(`<div id="drafts__app" />`);
        Drafts.cachedEl = appContainer as HTMLElement;
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const is_enabled = await enabledContains(["drafts"]);
        const positionElem = postbox?.querySelector("div.ctextarea");
        const container = postbox.querySelector("#drafts__app");
        if (is_enabled && !container && positionElem) {
            const nearestLi = postbox?.closest && postbox.closest("li[id^='item_']");
            const postid = parseInt(nearestLi?.id?.substr(5));
            const inputBox = postbox?.querySelector("#frm_body") as HTMLInputElement;

            const root = createRoot(Drafts.cachedEl!);
            positionElem.parentElement.insertBefore(Drafts.cachedEl, positionElem.nextElementSibling);
            root.render(<DraftsApp postid={postid} inputBox={inputBox} />);
        }
    },
};

export { Drafts };
