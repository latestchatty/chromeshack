import React from "react";
import { render } from "react-dom";
import { parseToElement } from "../../core/common/dom";
import { processPostBoxEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import "../../styles/post_preview.css";
import { PostPreviewApp } from "./PostPreviewApp";

const PostPreview = {
    cachedPaneEl: null as HTMLElement,
    cachedAppEl: null as HTMLElement,

    install() {
        processPostBoxEvent.addHandler(PostPreview.apply);
        PostPreview.cacheInjectables();
    },

    cacheInjectables() {
        const paneContainer = parseToElement(`<div id="post__preview__pane" />`) as HTMLElement;
        const appContainer = parseToElement(`<div id="post__preview__app" />`) as HTMLElement;
        PostPreview.cachedPaneEl = paneContainer;
        PostPreview.cachedAppEl = appContainer;
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const is_enabled = await enabledContains(["post_preview"]);
        const positionElem = postbox?.querySelector("div.csubmit");
        const container = postbox.querySelector("#post__preview__app");
        const altPositionElem = postbox?.querySelector("#frm_body");
        if (is_enabled && !container && positionElem) {
            const clonedAppEl = PostPreview.cachedAppEl.cloneNode(false) as HTMLElement;
            const clonedPaneEl = PostPreview.cachedPaneEl.cloneNode(false) as HTMLElement;
            render(<PostPreviewApp postboxElem={postbox} paneMountElem={clonedPaneEl} />, clonedAppEl);
            altPositionElem.parentNode.insertBefore(clonedPaneEl, altPositionElem);
            positionElem.append(clonedAppEl);
        }
    },
};

export { PostPreview };
