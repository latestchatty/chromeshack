import React from "react";
import { arrHas, classNames, objContainsProperty, objEmpty } from "../../common";
import { ResolveMedia } from "../../useResolvedLinks";
import { TwitterBadgeSVG, TwitterVerifiedSVG } from "./Icons";
import type { TweetParsed } from "./twitter";

const CompiledTweetText = ({ text }: { text: string }) => {
    if (!text) return <span />;
    // try to parse our tags, links, and text content into a set of rendered links
    const tagsReplaced = text.split(/([#@][A-Za-z0-9\._]+)|(https:\/\/t.co\/\w+)/gm);
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

const Twitter = (props: { response: TweetParsed }) => {
    const { response } = props || {};
    const mediaOptions = { controls: true, clickTogglesVisible: false };
    return (
        <>
            {!objContainsProperty("unavailable", response) && !objEmpty(response) ? (
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
                        <ResolveMedia
                            className="twitter__media__content"
                            links={response.tweetMediaItems}
                            options={mediaOptions}
                        />
                        <div className={classNames("twitter__quote__content", { hidden: !response.tweetQuoted })}>
                            {response.tweetQuoted && (
                                <>
                                    <div className="twitter__header">
                                        <a href={response.tweetQuoted.quotedUrl} className="profile__pic__link">
                                            <img
                                                className="user__profile__pic"
                                                alt=""
                                                src={response.tweetQuoted.quotedProfilePic}
                                            />
                                        </a>
                                        <a
                                            href={response.tweetQuoted ? response.tweetQuoted.quotedUrl : "#"}
                                            id="twitter__quote__displayname"
                                        >
                                            {response.tweetQuoted.quotedDisplayName || ""}
                                        </a>
                                        <TwitterVerifiedSVG active={!!response.tweetQuoted.quotedUserVerified} />
                                        <span className="twitter__quote__realname">
                                            {response.tweetQuoted.quotedRealName
                                                ? `@${response.tweetQuoted.quotedRealName}`
                                                : ""}
                                        </span>
                                    </div>
                                    <div className="twitter__quote__text__content">
                                        <CompiledTweetText text={response.tweetQuoted.quotedText} />
                                    </div>
                                    <ResolveMedia
                                        className="twitter__quote__media__content"
                                        links={response.tweetQuoted.quotedMediaItems}
                                        options={mediaOptions}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="twitter__timestamp">{response.timestamp}</div>
                </div>
            ) : (
                <div className="twitter__container">
                    <div className="twitter__403">
                        <span>This tweet is unavailable.</span>
                    </div>
                </div>
            )}
        </>
    );
};

const accumulateTweets = (tweetObj: TweetParsed) => {
    const tweetParents = arrHas(tweetObj?.tweetParents) ? tweetObj?.tweetParents : null;
    const parents = tweetParents
        ? tweetParents.reduce((acc, t, i) => {
              acc.push(<Twitter key={i} response={t} />);
              return acc;
          }, [] as React.ReactNode[])
        : null;
    return parents?.length > 0 ? (
        [...parents, <Twitter key={parents.length + 1} response={tweetObj} />]
    ) : (
        <Twitter response={tweetObj} />
    );
};
export const useTweets = (props: { tweetObj: TweetParsed }) => {
    const { tweetObj } = props || {};
    /// render Tweet children from a given twitter response object
    return accumulateTweets(tweetObj);
};
