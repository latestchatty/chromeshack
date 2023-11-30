const parseLink = (href: string) => {
  // $1 = VODs, $2 = channels, $3 = collections, $4 = time offset
  const isTwitch =
    /https?:\/\/(?!clips\.)(?:.*?\.)?twitch\.tv\/(?:(?:\w+\/v\/|videos\/)(\w+)|(\w+).?$)(?:.*?\??collection=([\w-]+))?(?:.*?\??t=(\w+)$)?/i.exec(
      href
    );
  // $1 = short form clips, $2 = long form clips
  const isTwitchClip =
    /https?:\/\/(?:clips\.twitch\.tv\/(\w+)|.*?\.twitch\.tv\/[\w-]+\/clip\/(\w+))/i.exec(
      href
    );

  const twitchClip = isTwitchClip ? isTwitchClip[1] || isTwitchClip[2] : null;
  const twitchVOD = isTwitch ? isTwitch[1] : null;
  const twitchChannel = isTwitch ? isTwitch[2] : null;
  const twitchCollection = isTwitch ? isTwitch[3] : null;
  const twitchVODOffset = isTwitch ? isTwitch[4] : null;

  const basePlayerUrl = "https://player.twitch.tv/?";
  const baseClipUrl = "https://clips.twitch.tv/embed?clip=";
  const endUrl = "&parent=www.shacknews.com&autoplay=true&muted=false";

  const channel = twitchChannel ? `channel=${twitchChannel}` : "";
  const video = twitchVOD ? `video=v${twitchVOD}` : "";
  const videoOffset = twitchVODOffset ? `&time=${twitchVODOffset}` : "";
  const collection = twitchCollection ? `collection=${twitchCollection}` : "";
  const clip = twitchClip || "";
  const h = { type: "iframe", href };

  //https://www.twitch.tv/clintstevens/clip/EphemeralUnsightlyCarrotLeeroyJenkins
  //https://player.twitch.tv/?video=vEphemeralUnsightlyCarrotLeeroyJenkins&parent=www.shacknews.com&autoplay=true&muted=false

  if (video && !collection)
    return {
      ...h,
      src: `${basePlayerUrl}${video}${endUrl}${videoOffset}`,
    } as ParsedResponse;
  else if (video && collection)
    return {
      ...h,
      src: `${basePlayerUrl}${video}&${collection}${endUrl}${videoOffset}`,
    } as ParsedResponse;
  else if (collection)
    return {
      ...h,
      src: `${basePlayerUrl}${collection}${endUrl}`,
    } as ParsedResponse;
  else if (channel)
    return {
      ...h,
      src: `${basePlayerUrl}${channel}${endUrl}`,
    } as ParsedResponse;
  else if (clip)
    return { ...h, src: `${baseClipUrl}${clip}${endUrl}` } as ParsedResponse;

  return null;
};

export const isTwitch = (href: string) => parseLink(href);
