import { objHas } from "../common";
import { enabledContains } from "./../settings";

/// normal image/video embeds
import { isChattypics } from "./chattypics";
import { isDropbox } from "./dropbox";
import { isGiphy } from "./giphy";
import { isTwimg } from "./twimg";
import { isDirectMedia } from "./directmedia";
/// iframe media embeds
import { isMixer } from "./mixer";
import { isTwitch } from "./twitch";
import { isXboxDVR } from "./xboxdvr";
import { isYoutube } from "./youtube";
/// native social embeds
import { isInstagram } from "./instagram";
import { isTwitter } from "./twitter";
/// resolvable media embeds
import { isImgur } from "./imgur";
import { isGfycat } from "./gfycat";
import { isTenor } from "./tenor";
/// resolvable iframe embeds
import { isStreamable } from "./streamable";
/// special embeds
import { isChattyLink } from "./chattypost";

export type ParsedType = "image" | "video" | "iframe" | "instagram" | "twitter" | "chattypost";
export interface ParsedResponse {
    src?: string;
    href?: string;
    type: ParsedType;
    args?: string[];
    cb?: (...args: string[]) => any;
    component?: JSX.Element;
    postid?: string;
    idx?: string;
}

/*
 * detectMediaLink expects implemented parsers to return one of two objects:
 * 1) { src: string, type: ... }
 * 2) { href: string, args: string[], type: ..., cb: Function }
 *      ^ (e.g.: cb(...args) => string)
 */
export const detectMediaLink = async (href: string) => {
    const mediaEnabled = await enabledContains("media_loader");
    const socialsEnabled = await enabledContains("social_loader");
    const chattypostEnabled = await enabledContains("getpost");

    // test if href matches any of our parsers
    if (mediaEnabled) {
        const chattypics = isChattypics(href);
        const dropbox = isDropbox(href);
        const twimg = isTwimg(href);
        const giphy = isGiphy(href);
        const directmedia = isDirectMedia(href);
        const normalMedia = chattypics || dropbox || twimg || giphy || directmedia;
        if (objHas(normalMedia)) return normalMedia;

        const imgur = isImgur(href);
        const gfycat = isGfycat(href);
        const tenor = isTenor(href);
        const resolvableMedia = imgur || gfycat || tenor;
        if (objHas(resolvableMedia)) return resolvableMedia;

        const streamable = isStreamable(href);
        const resolvableEmbeds = streamable;
        if (objHas(resolvableEmbeds)) return resolvableEmbeds;

        const mixer = isMixer(href);
        const twitch = isTwitch(href);
        const xboxdvr = isXboxDVR(href);
        const youtube = isYoutube(href);
        const iframeEmbeds = mixer || twitch || xboxdvr || youtube;
        if (objHas(iframeEmbeds)) return iframeEmbeds;
    }
    if (socialsEnabled) {
        const instagram = isInstagram(href);
        const twitter = isTwitter(href);
        const socialEmbeds = instagram || twitter;
        if (objHas(socialEmbeds)) return socialEmbeds;
    }
    if (chattypostEnabled) {
        const chattypost = isChattyLink(href);
        if (objHas(chattypost)) return chattypost;
    }
    return null;
};
