import { objHas } from "../common/common";
import { enabledContains } from "./../settings";
/// normal embeds
import { isChattyLink } from "./chattypost";
import { isDirectMedia } from "./directmedia";
import { isDropbox } from "./dropbox";
import { isGiphy } from "./giphy";
import { isGstatic } from "./gstatic";
import { isTumblr } from "./tumblr";
import { isImgflip } from "./imgflip";
/// resolvable media embeds
import { isImgur } from "./imgur";
/// resolvable iframe embeds
import { isStreamable } from "./streamable";
import { isTenor } from "./tenor";
import { isTwimg } from "./twimg";
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
    const dropbox = isDropbox(href);
    const twimg = isTwimg(href);
    const giphy = isGiphy(href);
    const imgflip = isImgflip(href);
    const gstatic = isGstatic(href);
    const tumblr = isTumblr(href);
    const directmedia = isDirectMedia(href);
    const normalMedia = dropbox || twimg || giphy || imgflip || gstatic || tumblr || directmedia;
    if (objHas(normalMedia)) return normalMedia;

    const imgur = isImgur(href);
    const tenor = isTenor(href);
    const resolvableMedia = imgur || tenor;
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
