const parseLink = (href: string) => {
  const isGiphy =
    /https?:\/\/(?:.+\.)?giphy\.com\/\w+?(?:\/(\w+)$|.+?-(\w+)$)/i.exec(href);
  return isGiphy
    ? ({
        href,
        src: `https://media0.giphy.com/media/${
          isGiphy[1] || isGiphy[2]
        }/giphy.mp4`,
        type: "video",
      } as ParsedResponse)
    : null;
};

export const isGiphy = (href: string) => parseLink(href);
