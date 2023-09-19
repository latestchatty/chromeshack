import React from "react";
import { render } from "react-dom";
import { parseToElement } from "../../core/common/dom";
import { processPostBoxEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import "../../styles/templates.css";
import { TemplatesApp } from "./TemplatesApp";

const Templates = {
    cachedEl: null as HTMLElement,

    install() {
        processPostBoxEvent.addHandler(Templates.apply);
        Templates.cacheInjectables();
    },

    cacheInjectables() {
        const appContainer = parseToElement(`<div id="templates__app" />`);
        Templates.cachedEl = appContainer as HTMLElement;
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const is_enabled = await enabledContains(["templates"]);
        const positionElem = postbox?.querySelector("div.csubmit");
        const container = postbox.querySelector("#templates__app");
        if (is_enabled && !container && positionElem) {
            const inputBox = postbox?.querySelector("#frm_body") as HTMLInputElement;
            render(<TemplatesApp inputBox={inputBox} />, Templates.cachedEl);
            positionElem.append(Templates.cachedEl);
        }
    },
};

export { Templates };
