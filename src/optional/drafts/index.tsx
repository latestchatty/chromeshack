import React from "react";
import { render } from "react-dom";
import { processPostBoxEvent } from "../../core/events";
import { PostboxEventArgs } from "../../core/events.d";
import { enabledContains } from "../../core/settings";
import { DraftsApp } from "./DraftsApp";
import "../../styles/drafts.css";

const Drafts = {
    async install() {
        const is_enabled = await enabledContains(["drafts"]);
        if (is_enabled) processPostBoxEvent.addHandler(Drafts.apply);
    },

    apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const positionElem = postbox?.querySelector("div.ctextarea");
        const container = postbox.querySelector("#drafts__app");
        if (!container && positionElem) {
            const appContainer = document.createElement("div");
            appContainer.setAttribute("id", "drafts__app");
            const nearestLi = postbox?.closest && postbox.closest("li[id^='item_']");
            const postid = parseInt(nearestLi?.id?.substr(5));
            render(<DraftsApp postid={postid} replyBox={postbox} />, appContainer);
            positionElem.parentElement.insertBefore(appContainer, positionElem.nextElementSibling);
        }
    },
};

export { Drafts };
