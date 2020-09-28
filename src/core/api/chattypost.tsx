import React from "react";
import type { ParsedResponse } from ".";
import { elemMatches, fetchSafe, safeInnerHTML } from "../common";

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
        if (spoilerTag)
            spoilerTag.addEventListener("click", (e: MouseEvent) => {
                const this_node = e?.target as HTMLElement;
                this_node?.setAttribute("class", "jt_spoiler_clicked");
            });

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
    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const _this =
            e?.target && elemMatches(e.target as HTMLAnchorElement, "div.getPost .postbody > a")
                ? (e.target as HTMLAnchorElement)
                : null;
        if (_this?.href) window.open(_this.href, "_blank", "noopener,noreferrer");
    };
    // return a simple React wrapper for the sanitized HTML
    return <div className="getPost" dangerouslySetInnerHTML={{ __html: html }} onClick={handleClick} />;
};

export const getChattyPost = async (...args: any[]) => {
    const [postid] = args || [];
    const postElemText = postid && (await fetchChattyPost(postid));
    const component = <Chattypost html={postElemText} />;
    return postElemText ? { component, type: "chattypost" } : null;
};

const parseLink = (href: string) => {
    const isChattyPost = /https?:\/\/(?:.+\.)?shacknews\.com\/chatty\?id=(\d+)/i.exec(href);
    return isChattyPost
        ? ({
              href: isChattyPost[0],
              args: [isChattyPost[1]],
              type: "chattypost",
              cb: getChattyPost,
          } as ParsedResponse)
        : null;
};

export const isChattyLink = (href: string) => parseLink(href);
