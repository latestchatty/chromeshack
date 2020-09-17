import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import type { ParsedResponse } from "../../core/api";
import { detectMediaLink } from "../../core/api";
import { arrEmpty, arrHas, locatePostRefs } from "../../core/common";
import { processPostEvent, processPostRefreshEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import { Expando } from "./Expando";

export interface ResolvedResponse {
    postid: string;
    idx: string;
    response: ParsedResponse;
}

const MediaEmbedderWrapper = (props: { links: HTMLAnchorElement[]; item: HTMLElement }) => {
    const { links, item } = props || {};
    const [responses, setResponses] = useState([] as ResolvedResponse[]);
    const [children, setChildren] = useState(null as React.ReactNode[]);
    useEffect(() => {
        const mediaLinkReplacer = async () => {
            if (!item) return;
            // replace each link with its mounted version
            const taggedLinks = item.querySelectorAll(`a[id^='tagged_']`);
            for (const link of taggedLinks || []) {
                const _this = link as HTMLAnchorElement;
                const postid = _this.dataset.postid;
                const idx = _this.dataset.idx;
                const matched = item.querySelector(`div#expando_${postid}-${idx}`);
                if (matched) link.replaceWith(matched);
            }
        };
        if (children) mediaLinkReplacer();
    }, [item, children]);
    useEffect(() => {
        if (!responses) return;

        const _children = [];
        for (const response of responses) {
            const { postid, idx, response: _response } = response || {};
            _children.push(<Expando key={idx} postid={postid} idx={idx} response={_response} />);
        }
        // return our rendered Expando links
        if (arrHas(_children)) setChildren(_children);
    }, [responses]);
    useEffect(() => {
        if (!links) return;
        const detectLinks = async () => {
            // tag all matching links and save their resolved responses
            const detectedLinks = arrHas(links)
                ? await links.reduce(async (acc, l, i) => {
                      // avoid clobbering NWS links
                      const _detected = await detectMediaLink(l.href);
                      const { postid } = locatePostRefs(l);
                      const _acc = await acc;
                      if (_detected) {
                          // tag the detected link in the DOM so we can replace it later
                          l.setAttribute("id", `tagged_${postid}-${i}`);
                          l.setAttribute("data-postid", postid);
                          l.setAttribute("data-idx", i.toString());
                          _acc.push({ postid, idx: i.toString(), response: _detected });
                      }
                      return _acc;
                  }, Promise.resolve([] as ResolvedResponse[]))
                : null;
            if (detectedLinks) setResponses(detectedLinks);
        };
        detectLinks();
    }, [links]);
    return <>{children}</>;
};

export const MediaEmbedder = {
    install() {
        processPostEvent.addHandler(MediaEmbedder.processPost);
        processPostRefreshEvent.addHandler(MediaEmbedder.processPost);
    },

    processPost(item: HTMLElement) {
        (async () => {
            // don't do processing if we don't need to
            const is_enabled = await enabledContains(["media_loader", "social_loader", "getpost"]);
            const isNWS = item?.querySelector(".fullpost.fpmod_nws");
            const NWS_enabled = await enabledContains(["nws_incognito"]);
            if ((isNWS && NWS_enabled) || !is_enabled) return;

            // render inside a hidden container in each fullpost
            const postbody = item?.querySelector(".sel > .fullpost > .postbody");
            const links = [...postbody?.querySelectorAll("a")] as HTMLAnchorElement[];
            const embedded = [...postbody?.querySelectorAll("div.medialink")] as HTMLElement[];

            if (arrHas(links) && arrEmpty(embedded)) {
                if (!postbody?.querySelector("#react-media-manager")) {
                    const container = document.createElement("div");
                    container.setAttribute("id", "react-media-manager");
                    //container.setAttribute("class", "hidden");
                    postbody.appendChild(container);
                }
                const mount = postbody?.querySelector("#react-media-manager");
                if (mount) render(<MediaEmbedderWrapper links={links} item={item} />, mount);
            }
        })();
    },
};
