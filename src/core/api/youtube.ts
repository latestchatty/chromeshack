import type { ParsedResponse } from "./";

const parseLink = (href: string) => {
    // youtube videos and/or playlists (vid id: $1 || $3, playlist id: $2, offset: $4)
    const isYoutube = /https?:\/\/(?:.+\.)?(?:youtu.be\/([\w-]+)(?:\?t=(\d+))?|youtube\..+?\/(?:.+v=([\w-]+)(?:&t=(\d+)?|&list=([\w-]+))?(?:.+&t=(\d+))?))/i.exec(
        href,
    );
    // youtu.be videos
    const isYoutubeShort = /https?:\/\/youtu\.be\/([\w-]+)(?:[&?]?t=(\d+))?/i.exec(href);

    const video = isYoutube ? isYoutube[1] || isYoutube[3] : isYoutubeShort ? isYoutubeShort[1] : "";
    const playlist = isYoutube ? isYoutube[2] : "";
    const offset = isYoutube ? isYoutube[4] || isYoutube[6] : isYoutubeShort ? isYoutubeShort[2] : "";
    const startAt = offset ? `&start=${offset}` : "";

    const h = { type: "iframe" };
    if (video && !playlist)
        return {
            ...h,
            src: `https://www.youtube.com/embed/${video}?autoplay=1${startAt}`,
        } as ParsedResponse;
    else if (video && playlist)
        return {
            ...h,
            src: `https://www.youtube.com/embed/${video}?autoplay=1&list=${playlist}${startAt}`,
        } as ParsedResponse;
    else if (!video && playlist)
        return { ...h, src: `https://www.youtube.com/embed/videoseries?autoplay=1&list=${playlist}` } as ParsedResponse;
    else return null;
};

export const isYoutube = (href: string) => parseLink(href);
