import * as browser from "webextension-polyfill";

import { objContains, isEmptyObj } from "../core/common";
import { processPostEvent } from "../core/events";
import { processExpandoLinks, toggleMediaItem, mediaContainerInsert, appendMedia } from "../core/media_helpers";
import { enabledContains, getEnabledSuboptions } from "../core/settings";

interface TweetMedia {
    type: string;
    video_info: {
        variants: Array<{
            content_type: string;
            url: string;
        }>;
    };
    media_url_https: string;
}

interface TweetResponse {
    tweetParentId?: string;
    tweetParents?: object;
    tweetUrl?: string;
    profilePic?: string;
    profilePicUrl?: string;
    displayName?: string;
    realName?: string;
    tweetText?: string;
    tweetMediaItems?: Array<TweetMedia[]>;
}

// Twitter and Instagram embedding support (WombatFromHell)
const EmbedSocials = {
    async install() {
        const is_enabled = await enabledContains("embed_socials");
        if (is_enabled) processPostEvent.addHandler(EmbedSocials.getLinks);
    },

    getLinks(item) {
        // don't retrace our DOM nodes (use relative positions of event items)
        const links = [...item.querySelectorAll(".sel .postbody a")];
        if (links) processExpandoLinks(links, EmbedSocials.getSocialType, EmbedSocials.processPost);
    },

    getSocialType(href) {
        const _isTwitter = /https?:\/\/(?:mobile\.|m\.)?twitter.com\/\w+\/status\/(\d+)/i;
        const _twttrMatch = _isTwitter.exec(href);
        if (_twttrMatch) return { type: 1, id: _twttrMatch && _twttrMatch[1] };
        return null;
    },

    processPost(e, parsedPost, postId, index) {
        if (e.button == 0) {
            e.preventDefault();
            const socialType = parsedPost.type;
            const socialId = parsedPost.id;
            // adjust relative node position based on expando state
            const _expandoClicked = e.target.classList !== undefined && objContains("expando", e.target.classList);
            const link = _expandoClicked ? e.target.parentNode : e.target;
            if (toggleMediaItem(link)) return;
            if (socialType === 1 && socialId) EmbedSocials.createTweet(link, socialId, postId, index);
        }
    },

    /*
        Twitter Implementation
    */
    async createTweet(parentLink, socialId, postId, index) {
        const tweetObj: TweetResponse = await EmbedSocials.fetchTweet(socialId);
        const tweetElem = EmbedSocials.renderTweet(parentLink, tweetObj, postId, index);
        const tweetContainer = document.createElement("div");
        getEnabledSuboptions("es_show_tweet_threads").then(async (showThreads) => {
            if (showThreads && tweetObj.tweetParentId) {
                const mutated = await EmbedSocials.fetchTweetParents(tweetObj);
                // stack the tweets (oldest to newest)
                tweetContainer.id = `loader_${postId}-${index}`;
                tweetContainer.classList.add("media-container");
                for (const tweetParent of mutated.tweetParents || []) {
                    const tweetParentElem = EmbedSocials.renderTweet(parentLink, tweetParent, postId, index);
                    tweetContainer.appendChild(tweetParentElem);
                }
                tweetContainer.appendChild(tweetElem);
            }
            mediaContainerInsert(
                tweetContainer.childElementCount > 0 ? tweetContainer : tweetElem,
                parentLink,
                postId,
                index,
            );
        });
    },

    async renderTweetObj(response) {
        const sortByBitrate = (mediaArr) => {
            const result = mediaArr.sort((a, b) => {
                if (a.bitrate < b.bitrate) return 1;
                else if (a.bitrate > b.bitrate) return -1;
                return 0;
            });
            return result;
        };
        const collectTweetMedia = (tweetMediaObj) => {
            const result = [];
            Object.values(tweetMediaObj).forEach((item: TweetMedia) => {
                if ((item.type === "video" || item.type === "animated_gif") && item.video_info.variants) {
                    const _sorted = sortByBitrate(
                        item.video_info.variants.filter((x) => x.content_type === "video/mp4"),
                    );
                    for (const vidItem of _sorted) {
                        result.push({ type: "video", url: vidItem.url });
                        break; // bail on the first match (highest res)
                    }
                } else if (item.type === "photo" && item.media_url_https)
                    result.push({ type: "photo", url: item.media_url_https });
            });
            return result;
        };
        const tagifyTweetText = (text) => {
            // try to parse our tags and text content into a DOM fragment
            const postTextContentElem = document.createElement("span");
            const hashReplacer = (match, g1) => {
                const _match = g1.replace("#", "");
                return `<a href="https://twitter.com/hashtag/${_match}?src=hash">#${_match}</a>`;
            };
            const atReplacer = (match, g1) => {
                const _match = g1.replace("@", "");
                return `<a href="https://twitter.com/${_match}">@${_match}</a>`;
            };
            const mediaReplacer = (match, g1) => {
                return `<a class="twitter-embed-link" href="${g1}">${g1}</a>`;
            };
            let postTextTagified = text.replace(/#(\w+)/gm, hashReplacer);
            postTextTagified = postTextTagified.replace(/@(\w+)/gm, atReplacer);
            postTextTagified = postTextTagified.replace(/(https:\/\/t.co\/\w+)/gim, mediaReplacer);
            postTextContentElem.innerHTML = postTextTagified;
            return postTextContentElem;
        };

        let result = {};
        if (response && !response.errors) {
            result = {
                tweetUrl: `https://twitter.com/${response.user.screen_name}/status/${response.id_str}`,
                profilePic: response.user.profile_image_url_https,
                profilePicUrl: `https://twitter.com/${response.user.screen_name}`,
                displayName: response.user.name,
                realName: response.user.screen_name,
                tweetText: tagifyTweetText(response.full_text).outerHTML,
                tweetMediaItems: response.extended_entities ? collectTweetMedia(response.extended_entities.media) : [],
                timestamp: new Date(Date.parse(response.created_at)).toLocaleString(),
                userVerified: response.user.verified,
            };
            if (response.quoted_status) {
                result = {
                    ...result,
                    tweetQuoted: {
                        quotedUrl: response.quoted_status_permalink.expanded,
                        quotedDisplayName: response.quoted_status.user.name,
                        quotedRealName: response.quoted_status.user.screen_name,
                        quotedText: tagifyTweetText(response.quoted_status.full_text).outerHTML,
                        quotedMediaItems: response.quoted_status.extended_entities
                            ? collectTweetMedia(response.quoted_status.extended_entities.media)
                            : [],
                    },
                };
            }
            if (response.in_reply_to_status_id_str) {
                result = {
                    ...result,
                    tweetParentId: response.in_reply_to_status_id_str,
                };
            }
        } else result = { unavailable: true };
        return result;
    },

    async fetchTweet(tweetId) {
        const token =
            "QUFBQUFBQUFBQUFBQUFBQUFBQUFBRGJiJTJGQUFBQUFBQVpQaURmd2VoMUtSMTdtTDdTRmVNTXpINEZLQSUzRFoxZ0ZXVmJxS2l6bjFweFZkcHFHSk85MW5uUVR3OVRFVHZrajRzcXZZcm9kcDc1OGo2";
        try {
            const response = await browser.runtime.sendMessage({
                name: "corbFetch",
                url: `https://api.twitter.com/1.1/statuses/show/${tweetId}.json?tweet_mode=extended`,
                fetchOpts: {
                    headers: { Authorization: `Bearer ${atob(token)}` },
                },
            });
            if (response) return EmbedSocials.renderTweetObj(response);
        } catch (e) {
            /* eat thrown rejections (likely 403s) */
        }
        return EmbedSocials.renderTweetObj(null); // render unavailable for failures
    },

    async fetchTweetParents(tweetObj) {
        const fetchParents = async (id, acc) => {
            const tweetObj: TweetResponse = await EmbedSocials.fetchTweet(id);
            if (tweetObj) acc.push(tweetObj);
            if (tweetObj && tweetObj.tweetParentId) return await fetchParents(tweetObj.tweetParentId, acc);
            return acc.reverse();
        };
        // accumulate each tweet in the tweet mention chain (oldest to newest)
        if (tweetObj.tweetParentId) {
            return {
                ...tweetObj,
                tweetParents: await fetchParents(tweetObj.tweetParentId, []),
            };
        }
        return [];
    },

    renderTweet(parentLink, tweetObj, postId, index) {
        const tweetTemplateElem = document.createElement("div");
        tweetTemplateElem.setAttribute("class", "twitter-container hidden");
        tweetTemplateElem.setAttribute("id", `loader_${postId}-${index}`);
        if (tweetObj && !tweetObj.unavailable) {
            tweetTemplateElem.innerHTML = /*html*/ `
            <div class="twitter-header">
                <a href="${tweetObj.profilePicUrl}" id="profile-pic-link">
                    <img id="user-profile-pic" src="${tweetObj.profilePic}" />
                </a>
                <div class="twitter-user-name">
                    <div>
                        <a href="${tweetObj.profilePicUrl}" id="twitter-displayname">${tweetObj.displayName}</a>
                        <svg version="1.1" id="twttr-verified" class="hidden" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 512 512" fill="#1DA1F2" xml:space="preserve"><path class="st0" d="M512,268c0,17.9-4.3,34.5-12.9,49.7c-8.6,15.2-20.1,27.1-34.6,35.4c0.4,2.7,0.6,6.9,0.6,12.6c0,27.1-9.1,50.1-27.1,69.1c-18.1,19.1-39.9,28.6-65.4,28.6c-11.4,0-22.3-2.1-32.6-6.3c-8,16.4-19.5,29.6-34.6,39.7C290.4,507,273.9,512,256,512c-18.3,0-34.9-4.9-49.7-14.9c-14.9-9.9-26.3-23.2-34.3-40c-10.3,4.2-21.1,6.3-32.6,6.3c-25.5,0-47.4-9.5-65.7-28.6c-18.3-19-27.4-42.1-27.4-69.1c0-3,0.4-7.2,1.1-12.6c-14.5-8.4-26-20.2-34.6-35.4C4.3,302.5,0,285.9,0,268c0-19,4.8-36.5,14.3-52.3c9.5-15.8,22.3-27.5,38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3c0-27,9.1-50.1,27.4-69.1c18.3-19,40.2-28.6,65.7-28.6c11.4,0,22.3,2.1,32.6,6.3c8-16.4,19.5-29.6,34.6-39.7C221.6,5.1,238.1,0,256,0c17.9,0,34.4,5.1,49.4,15.1c15,10.1,26.6,23.3,34.6,39.7c10.3-4.2,21.1-6.3,32.6-6.3c25.5,0,47.3,9.5,65.4,28.6c18.1,19.1,27.1,42.1,27.1,69.1c0,12.6-1.9,24-5.7,34.3c16,7.6,28.8,19.3,38.3,35.1C507.2,231.5,512,249,512,268z M245.1,345.1l105.7-158.3c2.7-4.2,3.5-8.8,2.6-13.7c-1-4.9-3.5-8.8-7.7-11.4c-4.2-2.7-8.8-3.6-13.7-2.9c-5,0.8-9,3.2-12,7.4l-93.1,140L184,263.4c-3.8-3.8-8.2-5.6-13.1-5.4c-5,0.2-9.3,2-13.1,5.4c-3.4,3.4-5.1,7.7-5.1,12.9c0,5.1,1.7,9.4,5.1,12.9l58.9,58.9l2.9,2.3c3.4,2.3,6.9,3.4,10.3,3.4C236.6,353.7,241.7,350.9,245.1,345.1z"/></svg>
                    </div>
                    <span id="twitter-realname">@${tweetObj.realName}</span>
                </div>
                <a href="${tweetObj.tweetUrl}" id="twitter-badge">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 33.88 33.88" fill="#1C9DEB" xml:space="preserve"><path d="M30.414,10.031c0.014,0.297,0.021,0.595,0.021,0.897c0,9.187-6.992,19.779-19.779,19.779c-3.928,0-7.58-1.149-10.657-3.123 c0.546,0.063,1.099,0.095,1.658,0.095c3.26,0,6.254-1.107,8.632-2.974c-3.039-0.058-5.607-2.065-6.491-4.828c0.424,0.082,0.858,0.125,1.308,0.125c0.635,0,1.248-0.084,1.83-0.244c-3.177-0.639-5.576-3.448-5.576-6.815 c0-0.029,0-0.058,0-0.087c0.939,0.521,2.01,0.833,3.15,0.869C2.646,12.48,1.419,10.35,1.419,7.938c0-1.274,0.343-2.467,0.94-3.495 c3.427,4.206,8.552,6.973,14.327,7.263c-0.117-0.509-0.18-1.038-0.18-1.584c0-3.838,3.112-6.949,6.953-6.949 c1.998,0,3.805,0.844,5.07,2.192c1.582-0.311,3.072-0.89,4.416-1.686c-0.521,1.624-1.621,2.986-3.057,3.844 c1.406-0.166,2.746-0.54,3.991-1.092C32.949,7.826,31.771,9.05,30.414,10.031z"/></svg>
                </a>
                </div>
                <div class="twitter-content">
                    <div id="twitter-text-content">${tweetObj.tweetText}</div>
                    <div id="twitter-media-content" class="hidden"></div>
                    <div id="twitter-quote-content" class="hidden">
                        <div>
                            <a href="${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedUrl : "#"}"
                                id="twitter-quote-displayname"
                            >
                                ${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedDisplayName : ""}
                            </a>
                            <span id="twitter-quote-realname">
                                @${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedRealName : ""}
                            </span>
                        </div>
                        <div id="twitter-quote-text-content">
                            ${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedText : ""}
                        </div>
                        <div id="twitter-quote-media-content" class="hidden"></div>
                    </div>
                </div>
                <div id="twitter-timestamp">${tweetObj.timestamp}</div>
            </div>`;
        } else {
            tweetTemplateElem.innerHTML = /*html*/ `
                <div class="twitter-403"><span>This tweet is unavailable.</span></div>
            `;
        }
        // compile media items into the "twitter-media-content" container
        const _compiledTemplate = EmbedSocials.compileTwitterMedia(
            parentLink,
            tweetTemplateElem,
            tweetObj,
            postId,
            index,
        );
        // toggle visibility of our verified badge if data allows it
        if (tweetObj && tweetObj.userVerified)
            _compiledTemplate.querySelector("#twttr-verified").classList.remove("hidden");
        return _compiledTemplate;
    },

    compileTwitterMedia(parentLink, templateElem, tweetObj, postId, index) {
        const parseMedia = (mediaObjArr) => {
            const mediaArr = [];
            mediaObjArr.forEach((item) => {
                mediaArr.push(item.url);
            });
            return mediaArr;
        };
        const mediaParent = templateElem.querySelector("#twitter-media-content");

        if (!isEmptyObj(tweetObj.tweetMediaItems) && tweetObj.tweetMediaItems.length > 0) {
            // let appendMedia decide if a carousel is necessary and return an element
            const mediaItems = parseMedia(tweetObj.tweetMediaItems);
            const mediaContainer = appendMedia({
                src: mediaItems,
                link: parentLink,
                postId,
                index,
                type: { twttrEmbed: true },
            });
            mediaParent.appendChild(mediaContainer);
            mediaParent.classList.remove("hidden");
        } else if (
            !isEmptyObj(tweetObj.tweetQuoted) &&
            Object.entries(tweetObj.tweetQuoted.quotedMediaItems).length > 0
        ) {
            // include media items inside quoted tweets (if available)
            const quotedMediaItems = parseMedia(tweetObj.tweetQuoted.quotedMediaItems);
            templateElem.querySelector("#twitter-quote-content").classList.remove("hidden");
            const quotedMediaParent = templateElem.querySelector("#twitter-quote-media-content");
            const mediaContainer = appendMedia({
                src: quotedMediaItems,
                link: parentLink,
                postId,
                index,
                type: { twttrEmbed: true },
            });
            quotedMediaParent.appendChild(mediaContainer);
            quotedMediaParent.classList.remove("hidden");
        } else if (tweetObj.tweetQuoted)
            templateElem.querySelector("#twitter-quote-content").classList.remove("hidden");
        return templateElem;
    },
};

export default EmbedSocials;
