const parseLink = (href: string) => {
    const isFacebook = /https:\/\/(?:.+\.)?facebook\.(?:.+?)\/(?:.+\/videos\/(\d+)\/?|video\.php\?v=(\d+))/i.exec(href);
    return isFacebook
        ? { src: `https://www.facebook.com/video/embed?video_id=${isFacebook[1] || isFacebook[2]}`, type: "iframe" }
        : null;
};

export const isFacebook = (href: string) => parseLink(href);
