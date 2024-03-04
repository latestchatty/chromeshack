import DOMPurify from "dompurify";
import xss from "xss";
import { arrHas, isJSON } from "./common";

const sanitizeObj = (val: any) => {
  // we use js-xss to sanitize JSON for use primarily in notifications/events
  const _objKeys = val && typeof val === "object" && Object.keys(val);
  if (Array.isArray(val))
    return val.reduce((acc, v) => {
      acc.push(sanitizeObj(v));
      return acc;
    }, []);
  else if (_objKeys?.length)
    return _objKeys.reduce(
      (acc: Record<string | number, any>, k: any) => {
        acc[k] = sanitizeObj(val[k]);
        return acc;
      },
      {} as Record<string | number, any>
    );

  // we only need to sanitize strings here
  if (val === null) return null;
  if (typeof val === "boolean" && val) return true;
  if (typeof val === "boolean" && !val) return false;
  else if (typeof val === "number") return val;
  return xss(val);
};
export const safeJSON = (text: string) => {
  if (isJSON(text))
    try {
      const obj = JSON.parse(text);
      const result = {} as Record<string, any>;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        result[key] = sanitizeObj(val);
      }
      return result;
    } catch (e: any) {
      throw Error(e);
    }

  return null;
};

const parseChattypics = (html: string) => {
  const _resFragment = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  const _resElemArr = _resFragment.querySelector("#allLinksDirect") as HTMLInputElement;
  const _resElemVal = _resFragment.querySelector("#link11") as HTMLInputElement;
  const linksArr = _resElemArr.value.split("\n").filter((x: string) => x !== "");
  const link = _resElemVal.value;
  return linksArr?.length > 0 ? linksArr : link ? [link] : null;
};
const parseShackRSS = (rssText: string) => {
  const result: ShackRSSItem[] = [];
  const _date = new Date();
  if (rssText.startsWith('<?xml version="1.0" encoding="utf-8"?>')) {
    const items = rssText.match(/<item>([\s\S]+?)<\/item>/gim);
    for (const i of items || []) {
      const title = i.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/im);
      const link = i.match(/<link>(.+?)<\/link>/im);
      const date = i.match(/<pubDate>(.+?)<\/pubDate>/im);
      const content = i.match(/<description><!\[CDATA\[(.+)[\s\S]*?\]\]><\/description>/im);
      const medialink = i.match(/<media:thumbnail url="(.+?)".*\/>/);
      const parsed: ShackRSSItem = {
        title: title ? DOMPurify.sanitize(title[1]) : "",
        link: link ? DOMPurify.sanitize(link[1]) : "",
        date: date ? DOMPurify.sanitize(date[1]) : _date.toISOString(),
        content: content ? DOMPurify.sanitize(content[1]) : "",
        medialink: medialink ? DOMPurify.sanitize(medialink[1]) : "",
      };
      result.push(parsed);
    }
  }
  // sanitize our resulting response
  return arrHas(result) ? result : null;
};
export const parseFetchResponse = async (textPromise: Promise<string>, parseType: ParseType) => {
  const { chattyPics, chattyRSS }: ParseType = parseType || {};
  const text = await textPromise;

  try {
    if (chattyPics)
      // sanitize ChattyPics response to array of links
      return parseChattypics(text);
    else if (chattyRSS && text)
      // sanitize and return as Shacknews RSS article list
      return parseShackRSS(text);
    else if (isJSON(text)) {
      // sanitize to JSON
      const parsed = safeJSON(text);
      if (parsed) return parsed;
    } else if (text.length > 0)
      // let the caller handle the text promise
      return text;
    // fallthrough: Gfycat (assume OK)
    else if (text.length === 0) return true;
  } catch (e) {
    if (e) console.error("Parse failed:", e);
    console.error("Parse failed!");
  }
  return null;
};

export const fetchSafe = (opts: FetchArgs): Promise<any> => {
  // used for sanitizing fetches
  // fetchOpts gets destructured in 'xhrRequest()'
  // parseType gets destructured into override bools:
  //   chattyPics: for parsing the post-upload HTML from Chattypics
  //   chattyRSS: to force parsing RSS to a sanitized JSON object
  //   instagram: for embedded instagram graphQL parsing
  //   json: to force sanitizing the response text as a JSON object
  const { url, fetchOpts, parseType } = opts || {};
  return new Promise((resolve, reject) =>
    fetch(url, fetchOpts)
      .then(async (res) => {
        const result = (res?.ok || res?.statusText === "OK") && res.text();
        const parsed = result ? parseFetchResponse(result, parseType as ParseType) : null;
        if (parsed) return resolve(parsed);
        console.error(res);
        return reject(res);
      })
      .catch((err) => {
        console.error(err);
        return reject(err);
      })
  );
};

// sugar for the CORB-safe versions of fetchSafe() GET/POST
export const fetchBackground = ({ url, fetchOpts, parseType }: FetchArgs) =>
  chrome.runtime.sendMessage({ name: "corbFetch", url, fetchOpts, parseType });
export const postBackground = ({ url, fetchOpts, parseType, data }: PostArgs) =>
  chrome.runtime.sendMessage({
    name: "corbPost",
    url,
    fetchOpts,
    parseType,
    data,
  });

export const waitToResolve = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const waitToFetchSafe = async (timeout: number, fetchArgs: FetchArgs) => {
  await waitToResolve(timeout);
  return await fetchSafe(fetchArgs);
};
