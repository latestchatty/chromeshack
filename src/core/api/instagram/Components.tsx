import React from "react";
import { classNames, decodeHTML, fetchBackground } from "../../common";
import { ResolveMedia } from "../../useResolvedLinks";
import { CommentsIcon, InstagramLogo, LikesIcon } from "./Icons";
import type { InstagramParsed, InstagramResponse, InstagramShortcodeMedia } from "./instagram";

const collectMedia = (media: InstagramShortcodeMedia) => {
    const links = [] as string[];
    if (media.__typename === "GraphSidecar")
        media.edge_sidecar_to_children.edges.forEach((edge) => {
            Object.entries(edge).forEach((item) => {
                // pick the video url of this item, or the smallest of the media choices (640x640)
                links.push(item[1].video_url != null ? item[1].video_url : item[1].display_resources[0].src);
            });
        });
    else if (media.__typename === "GraphVideo") links.push(media.video_url);
    else if (media.__typename === "GraphImage") links.push(media.display_resources[0].src);
    return links;
};

const parseDate = (timestamp: string) => {
    const _date = new Date(0);
    _date.setUTCSeconds(parseInt(timestamp));
    // we should have our relative local time now
    return `${_date.toLocaleString().split(",")[0]} ${_date.toLocaleTimeString()}`;
};

export const fetchInstagramData = async (shortcode: string) => {
    try {
        const url = `https://www.instagram.com/p/${shortcode}/`;
        const parsed: InstagramResponse =
            shortcode &&
            (await fetchBackground({
                url,
                parseType: { instagram: true },
            }));
        const _matchGQL = parsed && parsed.gqlData.shortcode_media;
        const _isPrivate = _matchGQL && _matchGQL.owner.is_private;
        if (!_matchGQL || _isPrivate)
            return { error: { msg: "This account or post has been made private or cannot be found:", url } };
        else if (_matchGQL)
            return {
                metaLikes: _matchGQL.edge_media_preview_like.count.toLocaleString(),
                metaComments: _matchGQL.edge_media_preview_comment.count.toLocaleString(),
                authorPic: _matchGQL.owner.profile_pic_url,
                authorName: _matchGQL.owner.username,
                authorFullName: _matchGQL.owner.full_name,
                postTimestamp: parseDate(_matchGQL.taken_at_timestamp),
                postUrl: `https://instagr.am/p/${_matchGQL.shortcode}/`,
                postCaption:
                    _matchGQL.edge_media_to_caption.edges.length > 0
                        ? decodeHTML(_matchGQL.edge_media_to_caption.edges[0].node.text)
                        : "",
                postMedia: collectMedia(_matchGQL),
            };
    } catch (e) {
        console.error(e);
    }
};

const InstagramCaption = ({ text }: { text: string }) => {
    const tagsReplaced = text?.split(/([#@][a-zA-Z\u00C0-\u017F0-9\.-_]+|[\r\n])/gm);
    const output = [];
    for (const [i, m] of tagsReplaced.entries() || []) {
        const isHash = m?.match(/^#/);
        const isTag = m?.match(/^@/);
        const isCR = m?.match(/[\r\n]/);
        if (isHash) {
            const hash = m?.replace("#", "");
            output.push(
                <a key={i} href={`https://instagr.am/explore/tags/${hash}`}>
                    #{hash}
                </a>,
            );
        } else if (isTag) {
            const tag = m?.replace("@", "");
            output.push(
                <a key={i} href={`https://instagr.am/${tag}`}>
                    @{tag}
                </a>,
            );
        } else if (isCR) {
            output.push(<br key={i} />);
        } else if (m) {
            output.push(m);
        }
    }
    return <span id="instagram__post__caption">{output}</span>;
};

const Instagram = (props: { response: InstagramParsed }) => {
    const { response } = props || {};

    const {
        metaLikes,
        metaComments,
        authorName,
        authorPic,
        postUrl,
        postCaption,
        authorFullName,
        postTimestamp,
        postMedia,
        error,
    } = response || {};

    if (!error)
        return (
            <div className="instagram__boundary">
                <div className="instagram__container">
                    <div className="instagram__header">
                        <a href={`https://instagr.am/${authorName}/`} className="instagram__profile__a">
                            <img className="instagram__author__pic circle" src={authorPic} alt="" />
                        </a>
                        <div className="instagram__postpic__line">
                            <a href={`https://instagr.am/${authorName}/`} className="instagram__profile__b">
                                <span className="instagram__author__nick">{authorName}</span>
                            </a>
                            <div className="instagram__postpic__details">
                                {metaLikes.length > 0 && (
                                    <>
                                        <LikesIcon />
                                        <span className="instagram__post__details">{`${metaLikes} likes`}</span>
                                    </>
                                )}
                                {metaComments.length > 0 && (
                                    <>
                                        <CommentsIcon />
                                        <span className="instagram__post__details">{`${metaComments} comments`}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="instagram__logo">
                            <a href={postUrl}>
                                <InstagramLogo />
                            </a>
                        </div>
                    </div>
                    <ResolveMedia
                        className="instagram__embed"
                        links={postMedia}
                        options={{ controls: true, clickTogglesVisible: false }}
                    />
                    <div className={classNames("instagram__caption", { hidden: postCaption.length === 0 })}>
                        <InstagramCaption text={postCaption} />
                    </div>
                    <div className="instagram__footer">
                        <span>A post shared by</span>
                        <a className="instagram__post__url" href={postUrl}>
                            <span className="instagram__postlink__name">{authorFullName}</span>
                        </a>
                        <span className="instagram__post__author">{authorName ? `(@${authorName})` : ""}</span>
                        <span className="instagram__post__timestamp">on {postTimestamp}</span>
                    </div>
                </div>
            </div>
        );
    else
        return (
            <div className="instagram__boundary">
                <div className="instagram__container">
                    <span className="instagram__error">
                        {error.msg}
                        <br />
                        {error.url}
                    </span>
                </div>
            </div>
        );
};

// render Instagram child from a given instagram response object
export const useInstagram = (instagramObj: InstagramParsed) => instagramObj && <Instagram response={instagramObj} />;
