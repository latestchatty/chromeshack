import React from "react";
import type { ParsedResponse } from ".";
import { LocalTimeStamp } from "../../builtin/local_timestamp";
import { elemMatches, fetchSafe, safeInnerHTML } from "../common";

const fetchChattyPost = async (postid: string) => {
    const singlePost = postid && `https://www.shacknews.com/frame_chatty.x?root=&id=${postid}`;
    if (singlePost) {
        const elemText = (await fetchSafe({ url: singlePost, parseType: { html: true } })) as string;
        const container = document.createElement("div");
        if (elemText) safeInnerHTML(elemText, container);
        else return null;
        // strip any mod banners from this embedded post (they look weird)
        const fullpost = container.querySelector("div.fullpost");

        const removedBanner = fullpost?.getAttribute("class").replace(/\bfpmod_.*?\s\b/i, "");
        if (removedBanner) fullpost.setAttribute("class", removedBanner);

        const userLine = fullpost?.querySelector("span.user");
        // workaround to avoid nuLOL tagline injection on the main Chatty
        if (userLine) userLine.setAttribute("class", "user_getPost");

        // fix timestamp for embedded chatty post
        const postdate = fullpost.querySelector("div.postdate") as HTMLElement;
        if (postdate) LocalTimeStamp.adjustPostTime({ post: postdate });
        // return the post as a sanitized string of HTML (without the container)
        return container.firstElementChild?.innerHTML;
    } else return null as string;
};

const Chattypost = (props: { html: string }) => {
    const { html } = props || {};
    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const _this = e?.target as HTMLElement;
        // handle all typical links in embedded chattyposts
        const _link = (elemMatches(_this, "a") || _this?.closest("a")) as HTMLAnchorElement;
        const spoilerTag = _this && (elemMatches(_this, "div.getPost span.jt_spoiler") as HTMLSpanElement);
        if (_link?.href) {
            e?.preventDefault();
            window.open(_link.href, "_blank", "noopener,noreferrer");
        } else if (spoilerTag && !spoilerTag.classList?.contains("jt_spoiler_clicked")) {
            spoilerTag.classList.remove("jt_spoiler");
            spoilerTag.classList.add("jt_spoiler_clicked");
        }
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
