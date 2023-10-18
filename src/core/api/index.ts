import { objHas } from "../common/common";
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
import { isTwimg } from "./twimg";
import { isGstatic } from "./gstatic";
/// resolvable media embeds
import { isImgur } from "./imgur";
/// resolvable iframe embeds
import { isStreamable } from "./streamable";
import { isTenor } from "./tenor";
import { isTwitch } from "./twitch";
import { isXboxDVR } from "./xboxdvr";
import { isYoutube } from "./youtube";

/*
 * detectMediaLink expects implemented parsers to return one of two objects:
 * 1) { src: string, type: ... }
 * 2) { href: string, args: string[], type: ..., cb: Function }
 *      ^ (e.g.: cb(...args) => string)
 */
export const detectMediaLink = async (href: string): Promise<ParsedResponse> => {
    const mediaEnabled = await enabledContains(["media_loader"]);
    const chattypostEnabled = await enabledContains(["getpost"]);

    // test if href matches any of our parsers
    if (mediaEnabled) {
        const chattypics = isChattypics(href);
        const dropbox = isDropbox(href);
        const twimg = isTwimg(href);
        const giphy = isGiphy(href);
        const imgflip = isImgflip(href);
        const gstatic = isGstatic(href);
        const directmedia = isDirectMedia(href);
        const normalMedia = chattypics || dropbox || twimg || giphy || imgflip || gstatic || directmedia;
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
    if (chattypostEnabled) {
        const chattypost = isChattyLink(href);
        if (objHas(chattypost)) return chattypost;
    }
    return null;
};
