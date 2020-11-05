import { objHas } from "../common";
import { enabledContains } from "./../settings";
/// normal image/video embeds
import { isChattypics } from "./chattypics";
/// special embeds
import { isChattyLink } from "./chattypost";
import { isDirectMedia } from "./directmedia";
import { isDropbox } from "./dropbox";
import { isGfycat } from "./gfycat";
import { isGiphy } from "./giphy";
import { isImgflip } from "./imgflip";
/// resolvable media embeds
import { isImgur } from "./imgur";
/// native social embeds
import { isInstagram } from "./instagram";
/// resolvable iframe embeds
import { isStreamable } from "./streamable";
import { isTenor } from "./tenor";
import { isTwimg } from "./twimg";
import { isTwitch } from "./twitch";
import { isTwitter } from "./twitter";
import { isXboxDVR } from "./xboxdvr";
import { isYoutube } from "./youtube";

export type ParsedType = "image" | "video" | "iframe" | "instagram" | "twitter" | "chattypost";
export interface ParsedResponse {
    src?: string;
    href?: string;
    type: ParsedType;
    args?: string[];
    cb?: (...args: string[]) => any;
    component?: JSX.Element;
    postid?: number;
    idx?: number;
}

/*
 * detectMediaLink expects implemented parsers to return one of two objects:
 * 1) { src: string, type: ... }
 * 2) { href: string, args: string[], type: ..., cb: Function }
 *      ^ (e.g.: cb(...args) => string)
 */
export const detectMediaLink = async (href: string): Promise<ParsedResponse> => {
    const mediaEnabled = await enabledContains(["media_loader"]);
    const socialsEnabled = await enabledContains(["social_loader"]);
    const chattypostEnabled = await enabledContains(["getpost"]);

    // test if href matches any of our parsers
    if (mediaEnabled) {
        const chattypics = isChattypics(href);
        const dropbox = isDropbox(href);
        const twimg = isTwimg(href);
        const giphy = isGiphy(href);
        const imgflip = isImgflip(href);
        const directmedia = isDirectMedia(href);
        const normalMedia = chattypics || dropbox || twimg || giphy || imgflip || directmedia;
        if (objHas(normalMedia)) return normalMedia;

        const imgur = isImgur(href);
        const gfycat = isGfycat(href);
        const tenor = isTenor(href);
        const resolvableMedia = imgur || gfycat || tenor;
        if (objHas(resolvableMedia)) return resolvableMedia;

        const streamable = isStreamable(href);
        const resolvableEmbeds = streamable;
        if (objHas(resolvableEmbeds)) return resolvableEmbeds;

        const twitch = isTwitch(href);
        const xboxdvr = isXboxDVR(href);
        const youtube = isYoutube(href);
        const iframeEmbeds = twitch || xboxdvr || youtube;
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
