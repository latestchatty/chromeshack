import React from "react";
import { fetchSafe, safeInnerHTML } from "../common";

import type { ParsedResponse } from ".";

const parseLink = (href: string) => {
    const isRootPost = /shacknews\.com\/chatty\?id=\d+/i.exec(href);
    const chattyPostIdMatch = /[?&]id=([^&#]*)/.exec(href);
    return isRootPost
        ? ({
              href: isRootPost[0],
              args: [chattyPostIdMatch[1]],
              type: "chattypost",
              cb: getChattyPost,
          } as ParsedResponse)
        : null;
};

export const isChattyLink = (href: string) => parseLink(href);

const fetchChattyPost = async (postid: string) => {
    const singlePost = postid && `https://www.shacknews.com/frame_chatty.x?root=&id=${postid}`;
    if (singlePost) {
        const elemText = (await fetchSafe({ url: singlePost, parseType: { html: true } })) as string;
        const container = document.createElement("div");
        if (elemText) safeInnerHTML(elemText, container);
        else return null;

        const _postNode = container.childNodes[1] as HTMLElement;
        // honor spoiler tags' click event when embedded
        const spoilerTag = _postNode?.querySelector("span.jt_spoiler");
        if (spoilerTag) {
            spoilerTag.addEventListener("click", (e: MouseEvent) => {
                const this_node = e?.target as HTMLElement;
                this_node?.setAttribute("class", "jt_spoiler_clicked");
            });
        }
        // strip any mod banners from this embedded post (they look weird)
        const fullpost = container.querySelector("div.fullpost");
        const removedBanner = fullpost?.getAttribute("class").replace(/\bfpmod_.*?\s\b/i, "");
        if (removedBanner) fullpost.setAttribute("class", removedBanner);
        // return the post as a sanitized string of HTML (without the container)
        return container.firstElementChild?.innerHTML;
    } else return null as string;
};

const Chattypost = (props: { html: string }) => {
    const { html } = props || {};
    // return a simple React wrapper for the sanitized HTML
    return <div className="getPost" dangerouslySetInnerHTML={{ __html: html }} />;
};

export const getChattyPost = async (...args: any[]) => {
    const [postid] = args || [];
    const postElemText = postid && (await fetchChattyPost(postid));
    const component = <Chattypost html={postElemText} />;
    return postElemText ? { component, type: "chattypost" } : null;
};
