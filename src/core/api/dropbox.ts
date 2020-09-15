import { isImage, isVideo } from "../common";
import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    const isDropbox = /https?:\/\/(?:.*?\.)?dropbox\.com\/s\/.+(?:png|jpe?g|gifv?|web[pm]|mov|mp4)\\?/i.test(href);
    const src = isDropbox && !/raw=1$/.test(href) && href.replace(/\?dl=0/i, "") + "?raw=1";
    const type = isVideo(src) ? { type: "video" } : isImage(src) ? { type: "image" } : null;
    return type ? ({ ...type, src } as ParsedResponse) : null;
};

export const isDropbox = (href: string) => parseLink(href);
