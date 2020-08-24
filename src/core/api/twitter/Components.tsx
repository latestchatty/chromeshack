import React, { useState, useEffect } from "react";

import useResolvedLink from "../../useResolvedLink";
import { objHas, objEmpty, objContainsProperty, arrHas, classNames } from "../../common";
import { TwitterVerifiedSVG, TwitterBadgeSVG } from "./Icons";

import type { TweetParsed, TweetMediaItem } from "./twitter.d";

const CompiledTweetText = ({ text }: { text: string }) => {
    if (!text) return <span />;
    // try to parse our tags, links, and text content into a set of rendered links
    const tagsReplaced = text.split(/(#\w+)|(@\w+)|(https:\/\/t.co\/\w+)/gm);
    const output = [];
    for (const [i, m] of tagsReplaced.entries() || []) {
        const isHash = m?.match(/^#/);
        const isTag = m?.match(/^@/);
        const isLink = m?.match(/^https/);
        if (isHash) {
            const hash = m?.replace("#", "");
            output.push(
                <a key={i} href={`https://twitter.com/hashtag/${hash}?src=hash`}>
                    #{hash}
                </a>,
            );
        } else if (isTag) {
            const tag = m?.replace("@", "");
            output.push(
                <a key={i} href={`https://twitter.com/${tag}`}>
                    @{tag}
                </a>,
            );
        } else if (isLink) {
            output.push(
                <a key={i} className="twitter-embed-link" href={m}>
                    {m}
                </a>,
            );
        } else if (m) {
            output.push(m);
        }
    }
    return <span>{output}</span>;
};

const CompiledMedia = (props: { mediaItems: TweetMediaItem[]; className?: string }) => {
    const { mediaItems, className } = props || {};
    const mediaChildren = arrHas(mediaItems) ? (
        mediaItems.reduce((acc, m, i) => {
            const media = useResolvedLink({
                link: m.url,
                postid: "0",
                idx: i.toString(),
                options: { loop: false, muted: false, autoPlay: false, controls: true },
            });
            if (media) {
                acc.push(<div key={i}>{media}</div>);
            }
            return acc;
        }, [] as React.ReactNode[])
    ) : (
        <div className="hidden" />
    );
    return <div className={className}>{mediaChildren}</div>;
};

const Twitter = (props: { response: TweetParsed }) => {
    const [component, setComponent] = useState(null);
    const { response } = props || {};
    useEffect(() => {
        /// render the parsed Tweet response as a React component
        if (!objContainsProperty("unavailable", response) && !objEmpty(response)) {
            setComponent(
                <div className="twitter__container">
                    <div className="twitter__header">
                        <a href={response.profilePicUrl} className="profile__pic__link">
                            <img className="user__profile__pic" alt="" src={response.profilePic} />
                        </a>
                        <div className="twitter__user__name">
                            <div>
                                <a href={response.profilePicUrl} id="twitter__displayname">
                                    {response.displayName}
                                </a>
                                <TwitterVerifiedSVG active={!!response?.userVerified} />
                            </div>
                            <span className="twitter__realname">{`@${response.realName}`}</span>
                        </div>
                        <a href={response.tweetUrl} className="twitter__badge">
                            <TwitterBadgeSVG />
                        </a>
                    </div>
                    <div className="twitter__content">
                        <div className="twitter__text__content">
                            <CompiledTweetText text={response.tweetText} />
                        </div>
                        <CompiledMedia className="twitter__media__content" mediaItems={response?.tweetMediaItems} />
                        <div className={classNames("twitter__quote__content", { hidden: !response.tweetQuoted })}>
                            <div>
                                <a
                                    href={response.tweetQuoted ? response.tweetQuoted.quotedUrl : "#"}
                                    id="twitter__quote__displayname"
                                >
                                    {response.tweetQuoted ? response.tweetQuoted.quotedDisplayName : ""}
                                </a>
                                <span className="twitter__quote__realname">
                                    {response.tweetQuoted ? `@${response.tweetQuoted.quotedRealName}` : ""}
                                </span>
                            </div>
                            <div className="twitter__quote__text__content">
                                <CompiledTweetText text={response.tweetQuoted?.quotedText} />
                            </div>
                            <CompiledMedia
                                className="twitter__quote__media__content"
                                mediaItems={response.tweetQuoted?.quotedMediaItems}
                            />
                        </div>
                    </div>
                    <div className="twitter__timestamp">{response.timestamp}</div>
                </div>,
            );
        } else {
            setComponent(
                <div className="twitter__container">
                    <div className="twitter__403">
                        <span>This tweet is unavailable.</span>
                    </div>
                </div>,
            );
        }
    }, []);
    return component;
};

const useTweets = (tweetObj: TweetParsed) => {
    /// render Tweet children from a given twitter response object
    const [children, setChildren] = useState(null);
    const accumulateTweets = () => {
        const tweetParents = arrHas(tweetObj?.tweetParents) ? tweetObj?.tweetParents : null;
        const parents = tweetParents
            ? tweetParents.reduce((acc, t, i) => {
                  acc.push(<Twitter key={i} response={t} />);
                  return acc;
              }, [] as React.ReactNode[])
            : null;
        const withNewest =
            parents?.length > 0 ? (
                [...parents, <Twitter key={parents.length + 1} response={tweetObj} />]
            ) : (
                <Twitter response={tweetObj} />
            );
        return withNewest;
    };
    useEffect(() => {
        if (objHas(tweetObj)) {
            const accumulatedTweets = accumulateTweets();
            if (accumulatedTweets) setChildren(accumulatedTweets);
        }
    }, []);
    return <>{children}</>;
};

export default useTweets;
