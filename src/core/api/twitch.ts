import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    // twitch channels, videos, and clips (with time offset)
    const isTwitch = /https?:\/\/(?:clips\.twitch\.tv\/(\w+)|(?:.*\.)?twitch\.tv\/(?:.*?\/clip\/(\w+)|(?:videos\/([\w-]+)(?:.*?t=(\w+))?|collections\/([\w-]+))|([\w-]+)))/i.exec(
        href,
    );
    if (isTwitch) {
        // twitch channels
        const h = { type: "iframe" };
        if (isTwitch[6])
            return {
                ...h,
                src: `https://player.twitch.tv/?channel=${isTwitch[6]}&autoplay=true&muted=false&parent=www.shacknews.com`,
            } as ParsedResponse;
        // twitch collections
        else if (isTwitch[5])
            return {
                ...h,
                src: `https://player.twitch.tv/?collection=${isTwitch[5]}&autoplay=true&muted=false&parent=www.shacknews.com`,
            } as ParsedResponse;
        // twitch videos
        else if (isTwitch[3])
            return {
                ...h,
                src: `https://player.twitch.tv/?video=v${
                    isTwitch[3]
                }&autoplay=true&muted=false&parent=www.shacknews.com${isTwitch[4] ? `&t=${isTwitch[4]}` : ""}`,
            } as ParsedResponse;
        // twitch clips
        else if (isTwitch[1] || isTwitch[2])
            return {
                ...h,
                src: `https://clips.twitch.tv/embed?clip=${
                    isTwitch[1] || isTwitch[2]
                }&autoplay=true&muted=false&parent=www.shacknews.com`,
            } as ParsedResponse;
    } else {
        return null;
    }
};

export const isTwitch = (href: string) => parseLink(href);
