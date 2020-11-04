import React from "react";
import { render } from "react-dom";
import { processPostBoxEvent } from "../../core/events";
import { PostboxEventArgs } from "../../core/events.d";
import { enabledContains } from "../../core/settings";
import { DraftsApp } from "./DraftsApp";
import "../../styles/drafts.css";

const Drafts = {
    install() {
        processPostBoxEvent.addHandler(Drafts.apply);
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const is_enabled = await enabledContains(["drafts"]);
        const positionElem = postbox?.querySelector("div.ctextarea");
        const container = postbox.querySelector("#drafts__app");
        if (is_enabled && !container && positionElem) {
            const appContainer = document.createElement("div");
            appContainer.setAttribute("id", "drafts__app");
            const nearestLi = postbox?.closest && postbox.closest("li[id^='item_']");
            const postid = parseInt(nearestLi?.id?.substr(5));
            const inputBox = postbox?.querySelector("#frm_body") as HTMLInputElement;
            render(<DraftsApp postid={postid} inputBox={inputBox} />, appContainer);
            positionElem.parentElement.insertBefore(appContainer, positionElem.nextElementSibling);
        }
    },
};

export { Drafts };
