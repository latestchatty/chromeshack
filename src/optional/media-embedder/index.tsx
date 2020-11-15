import React from "react";
import { render } from "react-dom";
import { detectMediaLink } from "../../core/api";
import { arrHas, domMutate, parseToElement } from "../../core/common";
import { processPostEvent, processPostRefreshEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import "../../styles/embed_socials.css";
import "../../styles/media.css";
import { Expando } from "./Expando";

export const MediaEmbedder = {
    cachedEl: null as HTMLElement,

    install() {
        MediaEmbedder.cacheInjectables();
        processPostEvent.addHandler(MediaEmbedder.processPost);
        processPostRefreshEvent.addHandler(MediaEmbedder.processPost);
    },

    cacheInjectables() {
        const container = parseToElement(`<div id="react-media-element" />`);
        MediaEmbedder.cachedEl = container as HTMLElement;
    },

    async processPost(args: PostEventArgs) {
        const { post } = args || {};
        // don't do processing if we don't need to
        const is_enabled = await enabledContains(["media_loader", "social_loader", "getpost"]);
        const isNWS = post?.querySelector(".fullpost.fpmod_nws");
        const NWS_enabled = await enabledContains(["nws_incognito"]);
        if ((isNWS && NWS_enabled) || !is_enabled) return;
        // render inside a hidden container in each fullpost
        const postbody = post?.querySelector(".sel > .fullpost > .postbody");
        const links = postbody && ([...postbody.querySelectorAll("a")] as HTMLAnchorElement[]);
        const openByDefault = await enabledContains(["auto_open_embeds"]);
        const rendered = [...post?.querySelectorAll("div#react-media-element")];
        if (rendered.length === 0 && arrHas(links)) {
            const process = async (l: HTMLAnchorElement) => {
                const detected = await detectMediaLink(l.href);
                if (!detected) return;
                const container = MediaEmbedder.cachedEl.cloneNode(false) as HTMLElement;
                await domMutate(() => {
                    // the container needs to remain in the DOM for events to work
                    postbody.append(container);
                    // replace each source link with the rendered media link
                    render(<Expando response={detected} options={{ openByDefault }} />, container, () =>
                        l.replaceWith(container.childNodes[0]),
                    );
                });
            };
            await Promise.all(links.map(process));
        }
    },
};
