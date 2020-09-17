import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    // $1 = short form lips, $2 = long form clips, $2 or $3 = long form VODs, $4 = channels, $5 = collections, $6 = time offset
    const isTwitch = /https?:\/\/(?:clips\.twitch\.tv\/(\w+)$|.*?\.twitch\.tv\/(?:(?:\w+\/clip\/|\w+\/v\/)(\w+)|videos\/(\w+)|(\w+).?$)(?:.*?\??collection=([\w-]+))?(?:.*?\??t=(\w+)$)?)/i.exec(
        href,
    );

    if (isTwitch) {
        const twitchClip = isTwitch[1] || isTwitch[2] || null;
        const twitchVOD = isTwitch[2] || isTwitch[3] || null;
        const twitchChannel = isTwitch[4] || null;
        const twitchCollection = isTwitch[5] || null;
        const twitchVODOffset = isTwitch[6] || null;

        const basePlayerUrl = "https://player.twitch.tv/?";
        const baseClipUrl = "https://clips.twitch.tv/embed?clip=";
        const endUrl = "&parent=www.shacknews.com&autoplay=true&muted=false";

        const channel = twitchChannel ? `channel=${twitchChannel}` : "";
        const video = twitchVOD ? `video=v${twitchVOD}` : "";
        const videoOffset = twitchVODOffset ? `&time=${twitchVODOffset}` : "";
        const collection = twitchCollection ? `collection=${twitchCollection}` : "";
        const clip = twitchClip || "";
        const h = { type: "iframe", href };

        if (video && !collection)
            return { ...h, src: `${basePlayerUrl}${video}${endUrl}${videoOffset}` } as ParsedResponse;
        else if (video && collection)
            return { ...h, src: `${basePlayerUrl}${video}&${collection}${endUrl}${videoOffset}` } as ParsedResponse;
        else if (collection) return { ...h, src: `${basePlayerUrl}${collection}${endUrl}` } as ParsedResponse;
        else if (channel) return { ...h, src: `${basePlayerUrl}${channel}${endUrl}` } as ParsedResponse;
        else if (clip) return { ...h, src: `${baseClipUrl}${clip}${endUrl}` } as ParsedResponse;
    }
    return null;
};

export const isTwitch = (href: string) => parseLink(href);
