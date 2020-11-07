import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import { detectMediaLink } from "../../core/api";
import { arrEmpty, arrHas, locatePostRefs, parseToElement } from "../../core/common";
import { processPostEvent, processPostRefreshEvent } from "../../core/events";
import { PostEventArgs } from "../../core/events.d";
import { enabledContains } from "../../core/settings";
import { Expando } from "./Expando";
import "../../styles/embed_socials.css";
import "../../styles/media.css";
import fastdom from "fastdom";

const MediaEmbedderWrapper = (props: { links: HTMLAnchorElement[]; item: HTMLElement; openByDefault?: boolean }) => {
    const { links, item, openByDefault } = props || {};
    const [children, setChildren] = useState(null as React.ReactNode[]);

    useEffect(() => {
        if (!arrHas(links)) return;
        // tag all matching links and mount Expando's for each one
        fastdom.mutate(async () => {
            const tagged = [] as JSX.Element[];
            const procTagged = async (l: HTMLAnchorElement, i: number) => {
                const detected = await detectMediaLink(l.href);
                if (detected) {
                    const { postid } = locatePostRefs(l);
                    // tag the detected link in the DOM so we can replace it later
                    l.setAttribute("id", `tagged_${postid}-${i}`);
                    l.setAttribute("data-postid", `${postid}`);
                    l.setAttribute("data-idx", `${i}`);
                    tagged.push(
                        <Expando key={i} postid={postid} idx={i} response={detected} options={{ openByDefault }} />,
                    );
                }
            };
            await Promise.all(links.map(procTagged));
            if (arrHas(tagged)) setChildren(tagged);
            // replace each tagged link with its mounted version
            const taggedLinks = [...item.querySelectorAll(`a[id^='tagged_']`)];
            const procReplace = async (l: HTMLAnchorElement) => {
                const _this = l as HTMLAnchorElement;
                const postid = _this?.dataset.postid;
                const idx = _this?.dataset.idx;
                const matched = item.querySelector(`div#expando_${postid}-${idx}`);
                if (matched) l.replaceWith(matched);
            };
            await Promise.all(taggedLinks.map(procReplace));
        });
    }, [links, openByDefault, item]);
    return <>{children}</>;
};

export const MediaEmbedder = {
    install() {
        processPostEvent.addHandler(MediaEmbedder.processPost);
        processPostRefreshEvent.addHandler(MediaEmbedder.processPost);
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
        const embedded = postbody && ([...postbody.querySelectorAll("div.medialink")] as HTMLElement[]);
        const openByDefault = await enabledContains(["auto_open_embeds"]);
        let container = postbody?.querySelector("#react-media-manager");

        if (arrHas(links) && arrEmpty(embedded) && !container) {
            container = parseToElement(`<div id="react-media-manager" />`);
            render(<MediaEmbedderWrapper links={links} item={post} openByDefault={openByDefault} />, container);
            postbody.appendChild(container);
        }
    },
};
