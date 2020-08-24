import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    const isMixer = /https:\/\/(?:.+\.)?mixer\.com\/([\w-]+)(\?vod=[\w-]+|\?clip=[\w-]+)?/i.exec(href);
    return isMixer
        ? ({ src: `https://mixer.com/embed/player/${isMixer[1]}${isMixer[2]}`, type: "iframe" } as ParsedResponse)
        : null;
};

export const isMixer = (href: string) => parseLink(href);
