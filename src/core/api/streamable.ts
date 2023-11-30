import { fetchBackground, fetchSafe } from "../common/fetch";

const resolveStreamable = async (shortcode: string) => {
  const __obf = "Basic aG9tdWhpY2xpckB3ZW1lbC50b3A=:JiMtMlQoOH1HSDxgJlhySg==";
  const json = await fetchSafe({
    url: `https://api.streamable.com/videos/${shortcode}`,
    fetchOpts: { headers: { Authorization: __obf } },
    parseType: { json: { ALLOWED_TAGS: ["iframe"] } },
  }); // sanitized in common.js!
  // strip everything but <iframe ... src="..."/>
  const url_match = json?.embed_code
    ? /src="(.*?)"/.exec(json.embed_code)
    : null;
  return url_match ? url_match[1] : null;
};

export const getStreamable = async (...args: any[]) => {
  const [shortcode] = args || [];
  const src = shortcode ? await resolveStreamable(shortcode) : null;
  return src ? { src, type: "iframe" } : null;
};

const parseLink = (href: string) => {
  const isStreamable = /https?:\/\/streamable\.com\/([\w]+)/i.exec(href);
  return isStreamable
    ? ({
        href,
        args: [isStreamable[1]],
        type: "iframe",
        cb: getStreamable,
      } as ParsedResponse)
    : null;
};

export const isStreamable = (href: string) => parseLink(href);
