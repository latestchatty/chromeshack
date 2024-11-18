const parseLink = (href: string) => {
  const isImgflip = /https?:\/\/(?:.+\.)?imgflip\.com\/(?:gif\/(\w+)|i\/(\w+))/i.exec(href);
  const video = isImgflip?.[1];
  const image = isImgflip?.[2];
  const baseUrl = "https://i.imgflip.com/";
  return video
    ? ({
        href,
        src: `${baseUrl}${video}.gif`,
        type: "video",
      } as ParsedResponse)
    : image
      ? ({
          href,
          src: `${baseUrl}${image}.jpg`,
          type: "image",
        } as ParsedResponse)
      : null;
};

export const isImgflip = (href: string) => parseLink(href);
