import type { ParsedResponse } from "./";

const decodeOffset = (text: string) => {
    const timeMatch = /(?:(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s))|(\d+)/i.exec(text);
    const hour = timeMatch && timeMatch[1];
    const min = timeMatch && timeMatch[2];
    const sec = (timeMatch && timeMatch[3]) || timeMatch[4];
    let offset = 0;
    if (hour) offset += parseInt(hour) * 60;
    if (min) offset += parseInt(min) * 60;
    if (sec) offset += parseInt(sec);
    return offset ? `&start=${offset}` : "";
};

const parseLink = (href: string) => {
    // youtube videos and/or playlists (vid id: $2, playlist id: $3, offset: $1 || $4)
    const isYoutube = /https?:\/\/(?:.+\.)?youtube\..+?\/(?:(?:embed\/|watch\?.*?(?:time_continue=(\w+))?[&?]?v=|)([\w-]+))(?:.*?[&?]list=([\w-]+))?(?:(?:.*?[&?#]t=|.*?[&?]start=)(\w+))?/i.exec(
        href,
    );
    // youtu.be videos w/wo offset (video id: $1, offset: $2)
    const isYoutubeShort = /https?:\/\/youtu\.be\/([\w-]+)(?:[&?]?t=(\d+))?/i.exec(href);

    const video = isYoutube ? isYoutube[2] : isYoutubeShort ? isYoutubeShort[1] : "";
    const playlist = isYoutube && isYoutube[3] ? `&list=${isYoutube[3]}` : "";
    const offset = isYoutube ? isYoutube[1] || isYoutube[4] : isYoutubeShort ? isYoutubeShort[2] : "";
    const startAt = offset ? decodeOffset(offset) : "";

    const h = { type: "iframe" };
    if (video)
        return {
            ...h,
            href,
            src: `https://www.youtube.com/embed/${video}?autoplay=1${playlist}${startAt}`,
        } as ParsedResponse;
    else if (!video && playlist)
        return {
            ...h,
            href,
            src: `https://www.youtube.com/embed/videoseries?autoplay=1${playlist}`,
        } as ParsedResponse;
    else return null;
};

export const isYoutube = (href: string) => parseLink(href);
