import React from "react";
import { useTweets } from "./Components";
import { fetchTweets } from "./helpers";

const TwitterWrapper = (props: { response: TweetParsed }) => {
    /// wrap useTweets() returning memoized renders of <Twitter /> FC's
    const { response } = props || {};
    return useTweets({ tweetObj: response });
};

export const getTwitter = async (...args: string[]) => {
    const [shortcode] = args || [];
    const response = shortcode ? await fetchTweets(shortcode) : null;
    return response ? { component: <TwitterWrapper response={response} />, type: "twitter" } : null;
};

const parseLink = (href: string) => {
    const isTwitter = /https?:\/\/(?:mobile\.|m\.)?twitter.com\/\w+\/status\/(\d+)/i.exec(href);
    return isTwitter
        ? ({
              href,
              args: [isTwitter[1]],
              type: "twitter",
              cb: getTwitter,
          } as ParsedResponse)
        : null;
};

export const isTwitter = (href: string) => parseLink(href);

export { fetchTweets, useTweets };
