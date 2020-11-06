import React from "react";
import { render } from "react-dom";
import { processPostBoxEvent } from "../../core/events";
import { PostboxEventArgs } from "../../core/events.d";
import { enabledContains } from "../../core/settings";
import { TemplatesApp } from "./TemplatesApp";
import "../../styles/templates.css";

const Templates = {
    install() {
        processPostBoxEvent.addHandler(Templates.apply);
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const is_enabled = await enabledContains(["templates"]);
        const positionElem = postbox?.querySelector("div.csubmit");
        const container = postbox.querySelector("#templates__app");
        if (is_enabled && !container && positionElem) {
            const appContainer = document.createElement("div");
            appContainer.setAttribute("id", "templates__app");
            const inputBox = postbox?.querySelector("#frm_body") as HTMLInputElement;
            render(<TemplatesApp inputBox={inputBox} />, appContainer);
            positionElem.append(appContainer);
        }
    },
};

export { Templates };
