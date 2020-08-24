import { fetchSafe } from "../common";

import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    const isTenor = /https?:\/\/(?:.+\.)?tenor\.com\/(?:images\/.+\/.+\?itemid=(\d+)|.+-(\d+)$)/i.exec(href);
    return isTenor ? ({ href, args: [isTenor[1] || isTenor[2]], type: "video", cb: getTenor } as ParsedResponse) : null;
};

export const isTenor = (href: string) => parseLink(href);

export const resolveTenor = async (shortcode: string) => {
    const __obf = atob("UE9JODJZS1NWRENQ");
    if (shortcode) {
        const response = await fetchSafe({
            url: `https://api.tenor.com/v1/gifs?ids=${shortcode}&key=${__obf}&limit=1`,
        });
        return response?.results[0]?.media[0]?.webm?.url || null;
    }
    return null;
};

export const getTenor = async (...args: any[]) => {
    const [shortcode] = args || [];
    const resolved = await resolveTenor(shortcode);
    return resolved ? { src: resolved, type: "video" } : null;
};
