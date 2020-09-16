import React, { useMemo } from "react";
import type { ParsedResponse } from "../../api";
import { fetchInstagramData, useInstagram } from "./Components";
import type { InstagramParsed } from "./instagram.d";

const InstagramWrapper = (props: { response: InstagramParsed }) => {
    /// wrap useInstagram() returning a memoized render of <Instagram />
    const { response } = props || {};
    const instagram = useInstagram(response);
    return useMemo(() => instagram, [instagram]);
};

export const getInstagram = async (...args: string[]) => {
    const [shortcode] = args || [];
    const response = shortcode ? await fetchInstagramData(shortcode) : null;
    return response ? { component: <InstagramWrapper response={response} />, type: "instagram" } : null;
};

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

export { fetchInstagramData, useInstagram };
export type { InstagramParsed };
