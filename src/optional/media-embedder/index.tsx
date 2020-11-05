import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import { detectMediaLink } from "../../core/api";
import { arrEmpty, arrHas, locatePostRefs, objHas } from "../../core/common";
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
        (async () => {
            if (!arrHas(links)) return;
            // tag all matching links and mount Expando's for each one
            const detectedLinks = arrHas(links)
                ? await links.reduce(async (acc, l, idx) => {
                      const detected = await detectMediaLink(l.href);
                      if (!detected) return await acc;
                      const { postid } = locatePostRefs(l);
                      const _acc = await acc;
                      if (objHas(detected)) {
                          // tag the detected link in the DOM so we can replace it later
                          l.setAttribute("id", `tagged_${postid}-${idx}`);
                          l.setAttribute("data-postid", `${postid}`);
                          l.setAttribute("data-idx", `${idx}`);
                          _acc.push(
                              <Expando
                                  key={idx}
                                  postid={postid}
                                  idx={idx}
                                  response={detected}
                                  options={{ openByDefault }}
                              />,
                          );
                      }
                      return _acc;
                  }, Promise.resolve([] as JSX.Element[]))
                : null;

            if (arrHas(detectedLinks)) {
                setChildren(detectedLinks);
                // replace each tagged link with its mounted version
                const taggedLinks = item.querySelectorAll(`a[id^='tagged_']`);
                for (const link of taggedLinks || []) {
                    const _this = link as HTMLAnchorElement;
                    const postid = _this.dataset.postid;
                    const idx = _this.dataset.idx;
                    const matched = item.querySelector(`div#expando_${postid}-${idx}`);
                    if (matched) link.replaceWith(matched);
                }
            }
        })();
    }, [links, openByDefault, item]);
    return <>{children}</>;
};

export const MediaEmbedder = {
    async install() {
        const is_enabled = await enabledContains(["media_loader", "social_loader", "getpost"]);
        if (is_enabled) {
            processPostEvent.addHandler(MediaEmbedder.processPost);
            processPostRefreshEvent.addHandler(MediaEmbedder.processPost);
        }
    },

    processPost(args: PostEventArgs) {
        const { post } = args || {};
        fastdom.measure(async () => {
            // don't do processing if we don't need to
            const isNWS = post?.querySelector(".fullpost.fpmod_nws");
            const NWS_enabled = await enabledContains(["nws_incognito"]);
            if (isNWS && NWS_enabled) return;
            // render inside a hidden container in each fullpost
            const postbody = post?.querySelector(".sel > .fullpost > .postbody");
            const links = postbody && ([...postbody.querySelectorAll("a")] as HTMLAnchorElement[]);
            const embedded = postbody && ([...postbody.querySelectorAll("div.medialink")] as HTMLElement[]);
            const openByDefault = await enabledContains(["auto_open_embeds"]);
            let container = postbody?.querySelector("#react-media-manager");

            if (arrHas(links) && arrEmpty(embedded) && !container) {
                container = document.createElement("div");
                container.setAttribute("id", "react-media-manager");
                fastdom.mutate(() => {
                    render(<MediaEmbedderWrapper links={links} item={post} openByDefault={openByDefault} />, container);
                    postbody.appendChild(container);
                });
            }
        });
    },
};
