import React, { useMemo } from "react";

import useInstagram, { fetchInstagramData } from "./Components";

import type { ParsedResponse } from "../../api";
import type { InstagramParsed } from "./instagram";
import useTweets from "../twitter";

const parseLink = (href: string) => {
    const isInstagram = /https?:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/(?:p|tv)\/([\w-]+)\/?/i.exec(href);
    return isInstagram
        ? ({
              href,
              args: [isInstagram[1]],
              type: "instagram",
              cb: getInstagram,
          } as ParsedResponse)
        : null;
};

export const isInstagram = (href: string) => parseLink(href);

const InstagramWrapper = (props: { response: InstagramParsed }) => {
    /// wrap useInstagram() returning a memoized render of <Instagram />
    const { response } = props || {};
    const instagram = response ? useInstagram(response) : null;
    const memoizedInstagram = useMemo(() => instagram, [instagram]);
    return <>{memoizedInstagram}</>;
};

export const getInstagram = async (...args: string[]) => {
    const [shortcode] = args || [];
    const response = shortcode ? await fetchInstagramData(shortcode) : null;
    return response ? { component: <InstagramWrapper response={response} />, type: "instagram" } : null;
};

export { fetchInstagramData };
export type { InstagramParsed };
export default useInstagram;
