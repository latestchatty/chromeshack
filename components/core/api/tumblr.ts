const parseLink = (href: string) => {
  // https://www.shacknews.com/chatty?id=42220700#item_42220700
  // https://www.shacknews.com/chatty?id=30740963#item_30740963
  // https://64.media.tumblr.com/88834cf83c3d3605998158dec8b65cc5/tumblr_op4uorwNHD1rn5gv3o2_500.gifv
  // http://25.media.tumblr.com/52873ffb17900edeea697e84406f2afc/tumblr_msh2juzcn81qfugwzo1_r1_1280.png
  const isTumblr = /(https?:\/\/(?:.+\.)?tumblr\.com\/\w+\/(tumblr_.+?)\.(gifv?|png|jpe?g)+?)/i.exec(href);
  const src = isTumblr?.[1];
  return src ? ({ type: "image", href, src } as ParsedResponse) : null;
};

export const isTumblr = (href: string) => parseLink(href);
