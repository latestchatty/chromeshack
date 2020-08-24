import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    const isXboxDVR = /https?:\/\/(?:.*\.)?xboxdvr\.com\/gamer\/([\w-]+)\/video\/([\w-]+)/i.exec(href);
    const src = isXboxDVR ? `https://xboxdvr.com/gamer/${isXboxDVR[1]}/video/${isXboxDVR[2]}/embed` : null;
    return src ? ({ src, type: "iframe" } as ParsedResponse) : null;
};

export const isXboxDVR = (href: string) => parseLink(href);
