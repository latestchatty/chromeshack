import { objEmpty, arrHas, objHas, fetchBackground } from "../../common";
import { getEnabledSuboptions } from "../../settings";

import type {
    TweetParsed,
    TweetMediaItem,
    TwitterResponse,
    TwitterResponseMediaItem,
    TwitterMediaItemVariant,
} from "./twitter";

export const decodeHTMLEntities = (text: string) => {
    // somewhat risky but lazy - we're okay with that (tweet text is pre-sanitized)
    const ta = document.createElement("textarea");
    if (text) ta.innerHTML = text;
    return ta.value || "";
};

export const parseMedia = (mediaObjArr: TweetMediaItem[]) =>
    !objEmpty(mediaObjArr)
        ? mediaObjArr.reduce((pv, v) => {
              if (v.url) pv.push(v.url);
              return pv;
          }, [])
        : null;

export const sortByBitrate = (mediaArr: TwitterMediaItemVariant[]) => {
    // prioritize the highest bitrate source
    const result = mediaArr.sort((a, b) => {
        if (a.bitrate < b.bitrate) return 1;
        else if (a.bitrate > b.bitrate) return -1;
        return 0;
    });
    return result;
};

export const collectMedia = (tweetMediaObj: TwitterResponseMediaItem[]) => {
    const result: TweetMediaItem[] = [];
    for (const item of Object.values(tweetMediaObj) || []) {
        if ((item.type === "video" || item.type === "animated_gif") && item.video_info.variants) {
            const sorted = sortByBitrate(item.video_info.variants.filter((x) => x.content_type === "video/mp4"));
            for (const vidItem of sorted) {
                result.push({ type: "video", url: vidItem.url });
                break; // bail on the first match (highest res)
            }
        } else if (item.type === "photo" && item.media_url_https)
            result.push({ type: "photo", url: item.media_url_https });
    }
    return result;
};

export const renderTweetObj = async (response: TwitterResponse) => {
    let result: TweetParsed = {};
    if (response && !response.errors) {
        result = {
            tweetUrl: `https://twitter.com/${response.user.screen_name}/status/${response.id_str}`,
            profilePic: response.user.profile_image_url_https,
            profilePicUrl: `https://twitter.com/${response.user.screen_name}`,
            displayName: response.user.name,
            realName: response.user.screen_name,
            tweetText: decodeHTMLEntities(response.full_text),
            tweetMediaItems: response.extended_entities ? collectMedia(response.extended_entities.media) : [],
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
                    quotedText: response.quoted_status.full_text,
                    quotedMediaItems: response.quoted_status.extended_entities
                        ? collectMedia(response.quoted_status.extended_entities.media)
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
};

export const fetchTweet = async (tweetId: string): Promise<TweetParsed> => {
    const token =
        "QUFBQUFBQUFBQUFBQUFBQUFBQUFBRGJiJTJGQUFBQUFBQVpQaURmd2VoMUtSMTdtTDdTRmVNTXpINEZLQSUzRFoxZ0ZXVmJxS2l6bjFweFZkcHFHSk85MW5uUVR3OVRFVHZrajRzcXZZcm9kcDc1OGo2";
    try {
        // NOTE: sanitized in fetch.ts
        const response = (await fetchBackground({
            url: `https://api.twitter.com/1.1/statuses/show/${tweetId}.json?tweet_mode=extended`,
            fetchOpts: {
                headers: { Authorization: `Bearer ${atob(token)}` },
            },
        })) as TwitterResponse;
        if (response) return renderTweetObj(response);
    } catch (e) {
        /* eat thrown rejections (likely 403s) */
    }
    return renderTweetObj(null); // render unavailable for failures
};

export const fetchTweetParents = async (tweetObj: TweetParsed) => {
    /// construct a parent tweet chain from a given tweet
    const { tweetParentId: pid } = tweetObj || {};
    const fetchParents = async (id: string, acc: TweetParsed[]): Promise<TweetParsed[]> => {
        // recursively accumulate each rendered parent tweet into an array
        const parentTweet = await fetchTweet(id);
        if (objHas(parentTweet)) acc.push(parentTweet);
        // continue parsing the tweet chain
        const { tweetParentId: _pid } = parentTweet || {};
        if (_pid) return await fetchParents(_pid, acc);
        // otherwise return in reverse order (oldest tweet to newest)
        return acc.reverse();
    };
    if (pid) {
        const parentTweets = await fetchParents(pid, [] as TweetParsed[]);
        // push the rendered tweets into the tweetParents property of our OT
        const mutated = arrHas(parentTweets) ? ({ ...tweetObj, tweetParents: parentTweets } as TweetParsed) : null;
        return mutated;
    } else return null;
};

export const fetchTweets = async (tweetId: string) => {
    /// use with useTweets() to fetch a fully rendered Twitter response
    const showTweetThreads = await getEnabledSuboptions("sl_show_tweet_threads");
    const tweetObj = await fetchTweet(tweetId);
    if (showTweetThreads && tweetObj.tweetParentId) {
        const withParents = await fetchTweetParents(tweetObj);
        return withParents;
    } else return tweetObj;
};
