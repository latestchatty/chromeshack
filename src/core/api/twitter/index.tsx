import React, { useMemo } from "react";

import useTweets from "./Components";
import { fetchTweets } from "./helpers";

import type { ParsedResponse } from "../../api";
import type { TweetParsed } from "./twitter";
import { arrHas, objHas } from "../../common";

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

const TwitterWrapper = (props: { response: TweetParsed }) => {
    /// wrap useTweets() returning memoized renders of <Twitter /> FC's
    const { response } = props || {};
    const tweets = response ? useTweets(response) : null;
    const memoizedTweets = useMemo(() => tweets, [tweets]);
    return <>{memoizedTweets}</>;
};

export const getTwitter = async (...args: string[]) => {
    const [shortcode] = args || [];
    const response = shortcode ? await fetchTweets(shortcode) : null;
    return response ? { component: <TwitterWrapper response={response} />, type: "twitter" } : null;
};

export { fetchTweets };
export type { TweetParsed };
export default useTweets;
