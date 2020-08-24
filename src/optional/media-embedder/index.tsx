import React, { useEffect, useState } from "react";
import { render } from "react-dom";

import { processPostEvent } from "../../core/events";
import { arrHas, objHas, locatePostRefs } from "../../core/common";
import { detectMediaLink } from "../../core/api";

import Expando from "./Expando";

export interface MediaLinkOptions {
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    autoPlay?: boolean;
}

const MediaEmbedderWrapper = (props: { links: HTMLAnchorElement[]; item: HTMLElement }) => {
    const { links, item } = props || {};
    const [children, setChildren] = useState(null);
    const mediaLinkReplacer = () => {
        if (!item) return;
        /// replace each link with its mounted version
        const taggedLinks = item.querySelectorAll(`a[id^='tagged_']`);
        for (const link of taggedLinks || []) {
            const _this = link as HTMLAnchorElement;
            const postid = _this.dataset.postid;
            const idx = _this.dataset.idx;
            const matched = item.querySelector(`div#expando_${postid}-${idx}`);
            if (matched) link.replaceWith(matched);
        }
    };
    useEffect(() => {
        if (children) mediaLinkReplacer();
    }, [children]);
    useEffect(() => {
        (async () => {
            // tag all matching links and embed an Expando toggle for each one
            const detected = arrHas(links)
                ? await links.reduce(async (acc, l, i) => {
                      const _acc = await acc;
                      const { postid } = locatePostRefs(l);
                      const detected = await detectMediaLink(l.href);
                      if (detected) {
                          // tag the detected link in the DOM so we can replace it later
                          l.setAttribute("id", `tagged_${postid}-${i}`);
                          l.setAttribute("data-postid", postid);
                          l.setAttribute("data-idx", i.toString());
                      }
                      if (objHas(detected)) {
                          if (detected.type === "twitter" || detected.type === "instagram")
                              _acc.push(
                                  <Expando
                                      key={i}
                                      postid={postid}
                                      idx={i.toString()}
                                      link={l}
                                      options={{ muted: false, autoPlay: false }}
                                  />,
                              );
                          else _acc.push(<Expando key={i} postid={postid} idx={i.toString()} link={l} />);
                      }
                      return _acc;
                  }, Promise.resolve([] as React.ReactChild[]))
                : null;
            if (detected) setChildren(detected);
        })();
    }, []);
    return <>{children}</>;
};

const MediaEmbedder = {
    install() {
        processPostEvent.addHandler(MediaEmbedder.processPost);
    },

    processPost(item: HTMLElement) {
        // render inside a hidden container in each fullpost
        const postbody = item?.querySelector(".sel > .fullpost > .postbody");
        const links = [...postbody?.querySelectorAll("a")] as HTMLAnchorElement[];

        (async () => {
            if (arrHas(links)) {
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
export default MediaEmbedder;
