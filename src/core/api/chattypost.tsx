import React from "react";
import type { ParsedResponse } from ".";
import { LocalTimeStamp } from "../../builtin/local_timestamp";
import "../../styles/chattypost.css";
import { elemMatches, fetchSafe, objHas, safeInnerHTML } from "../common";

interface ParsedChattyPost {
    postid: number;
    permalink: string;
    author: string;
    authorid: number;
    saneAuthor: string;
    icons: HTMLImageElement[];
    postbody: string;
    postdate: string;
}

const parseChattyPost = (html: string) => {
    const container = document.createElement("div");
    safeInnerHTML(html, container);
    const fullpost = container.querySelector(".fullpost") as HTMLDivElement;
    const authorid = parseInt(fullpost?.getAttribute("class")?.split("fpauthor_")[1]);
    const permalink = (container.querySelector(".postnumber>a") as HTMLAnchorElement)?.href;
    const postid = parseInt(permalink?.split("item_")[1]);
    const author = (container.querySelector(".user>a") as HTMLAnchorElement)?.textContent;
    const saneAuthor = author.replace(/\s/gm, "+");
    const icons = [...container.querySelectorAll("span.author>img")] as HTMLImageElement[];
    const postbody = (container.querySelector(".postbody") as HTMLDivElement)?.innerHTML;
    const postdate = (container.querySelector(".postdate") as HTMLDivElement)?.textContent;
    const fixedDate = LocalTimeStamp.fixTime(postdate);
    return html
        ? ({
              postid,
              authorid,
              permalink,
              author,
              saneAuthor,
              icons,
              postbody,
              postdate: fixedDate,
          } as ParsedChattyPost)
        : null;
};

const fetchChattyPost = async (postid: string) => {
    const singlePost = postid && `https://www.shacknews.com/frame_chatty.x?root=&id=${postid}`;
    if (singlePost) {
        const elemText = (await fetchSafe({ url: singlePost, parseType: { html: true } })) as string;
        if (!elemText) return null;
        return parseChattyPost(elemText);
    }
    return null;
};

const Chattypost = (props: { parsed: ParsedChattyPost }) => {
    const { parsed } = props || {};
    const { postid, permalink, author, authorid, saneAuthor, icons, postbody, postdate } = parsed || {};

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const _this = e?.target as HTMLElement;
        // handle all typical links in embedded chattyposts
        const _link = (elemMatches(_this, "a") || _this?.closest("a")) as HTMLAnchorElement;
        const spoilerTag =
            _this && (elemMatches(_this, "div.chattypost__container span.jt_spoiler") as HTMLSpanElement);
        if (_link?.href) {
            e?.preventDefault();
            window.open(_link.href, "_blank", "noopener,noreferrer");
        } else if (spoilerTag && !spoilerTag.classList?.contains("jt_spoiler_clicked")) {
            spoilerTag.classList.remove("jt_spoiler");
            spoilerTag.classList.add("jt_spoiler_clicked");
        }
    };
    // return a simple React wrapper for the sanitized HTML
    return objHas(parsed) ? (
        <div className="chattypost__container">
            <div className={`chattypost__hdr ${authorid ? `fpauthor_${authorid}` : ""}`}>
                <div className="postnumber">
                    <a
                        rel="nofollow noreferrer"
                        title="Permalink"
                        href={permalink}
                        onClick={handleClick}
                    >{`#${postid}`}</a>
                </div>
                <span className="author">
                    {"By: "}
                    <span className="username" data-author={author}>
                        <a
                            rel="nofollow noreferrer"
                            href={`/user/${saneAuthor}/posts`}
                            title={`${author}'s comments`}
                            onClick={handleClick}
                        >
                            {author}
                        </a>
                    </span>
                </span>
                <a
                    rel="nofollow noreferrer"
                    href={`/messages?method=compose&to=${saneAuthor}`}
                    className="shackmsg"
                    title={`Shack message ${author}`}
                    onClick={handleClick}
                >
                    <img src="/images/envelope.gif" alt="shackmsg this person" />
                </a>
                {icons?.map((icon, i) => {
                    return (
                        <div className="icon__container" key={i} dangerouslySetInnerHTML={{ __html: icon.outerHTML }} />
                    );
                })}
            </div>
            <div className="postbody" dangerouslySetInnerHTML={{ __html: postbody }} onClick={handleClick}></div>
            <div className="postdate">{postdate}</div>
        </div>
    ) : null;
};

export const getChattyPost = async (...args: any[]) => {
    const [postid] = args || [];
    const parsed = postid && (await fetchChattyPost(postid));
    const component = <Chattypost parsed={parsed} />;
    return component ? { component, type: "chattypost" } : null;
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
