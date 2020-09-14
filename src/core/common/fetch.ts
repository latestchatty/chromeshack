import DOMPurify from "dompurify";
import { browser } from "webextension-polyfill-ts";

import { objHas, arrHas, isHTML, isJSON, sanitizeToFragment } from "./";

export type PurifyConfig = Record<string, any>;
export interface ParseType {
    chattyPics?: boolean;
    chattyRSS?: boolean;
    instagram?: boolean;
    json?: boolean | PurifyConfig;
    html?: boolean | PurifyConfig;
}

export interface FetchArgs extends RequestInit {
    url: string;
    fetchOpts?: RequestInit;
    parseType?: ParseType;
}
export interface PostArgs extends FetchArgs {
    data?: any;
}

export interface ShackRSSItem {
    title?: string;
    link?: string;
    date?: string;
    content?: string;
    medialink?: string;
}

export const xhrRequestLegacy = (url: string, optionsObj?: RequestInit) => {
    // promisified legacy XHR helper using XMLHttpRequest()
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(objHas(optionsObj) ? optionsObj.method : "GET", url);
        if (objHas(optionsObj) && optionsObj.headers) {
            const headers = optionsObj.headers as Record<string, any>;
            for (const key of Object.keys(headers) || []) {
                const value = headers[key] as string;
                xhr.setRequestHeader(key, value);
            }
        }

        xhr.onload = function () {
            if ((this.status >= 200 && this.status < 300) || xhr.statusText.toUpperCase().indexOf("OK") > -1) {
                resolve(xhr.response);
            }

            reject({ status: this.status, statusText: xhr.statusText });
        };
        xhr.onerror = function () {
            reject({ status: this.status, statusText: xhr.statusText });
        };
        xhr.send();
    });
};

export const fetchSafeLegacy = ({ url, fetchOpts, parseType }: FetchArgs): Promise<any> => {
    // used for sanitizing legacy fetches (takes type: [(JSON) | HTML])
    return new Promise((resolve, reject) => {
        xhrRequestLegacy(url, fetchOpts)
            .then((res: any) => {
                const result = res && parseFetchResponse(res, parseType);
                if (result) resolve(result);
                console.error(res);
                return reject(res);
            })
            .catch((err) => {
                console.error(err);
                return reject(err);
            });
    });
};

export const fetchSafe = ({ url, fetchOpts, parseType }: FetchArgs): Promise<any> => {
    // used for sanitizing fetches
    // fetchOpts gets destructured in 'xhrRequest()'
    // parseType gets destructured into override bools:
    //   chattyPics: for parsing the post-upload HTML from Chattypics
    //   instagram: for embedded instagram graphQL parsing
    //   chattyRSS: to force parsing RSS to a sanitized JSON object
    //   html: to force parsing as HTML fragment
    // NOTE: HTML type gets sanitized to a document fragment
    return new Promise((resolve, reject) =>
        fetch(url, fetchOpts)
            .then(async (res) => {
                const result = (res?.ok || res?.statusText === "OK") && res.text();
                const parsed = result ? parseFetchResponse(result, parseType) : null;
                if (parsed) return resolve(parsed);
                console.error(res);
                return reject(res);
            })
            .catch((err) => {
                console.error(err);
                return reject(err);
            }),
    );
};

// sugar for the CORB-safe versions of fetchSafe() GET/POST
export const fetchBackground = ({ url, fetchOpts, parseType }: FetchArgs) =>
    browser.runtime.sendMessage({ name: "corbFetch", url, fetchOpts, parseType });
export const postBackground = ({ url, fetchOpts, parseType, data }: PostArgs) =>
    browser.runtime.sendMessage({
        name: "corbPost",
        url,
        fetchOpts,
        parseType,
        data,
    });

const waitToResolve = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const waitToFetchSafe = async (timeout: number, fetchArgs: FetchArgs) => {
    await waitToResolve(timeout);
    return await fetchSafe(fetchArgs);
};

const sanitizeObj = (val: any, purifyConfig?: PurifyConfig) => {
    if (val && Array.isArray(val)) {
        const _arr = [] as any[];
        for (const subval of val) _arr.push(sanitizeObj(subval));
        return _arr;
    } else if (val && typeof val === "object" && Object.keys(val).length > 0) {
        const _obj = {} as Record<string, any>;
        for (const key in val) _obj[key] = sanitizeObj(val[key]);
        return _obj;
    } else {
        if (val === null) return null;
        if (typeof val === "boolean" && val) return true;
        if (typeof val === "boolean" && !val) return false;
        else return DOMPurify.sanitize(val, purifyConfig);
    }
};
export const safeJSON = (text: string, purifyConfig?: PurifyConfig) => {
    if (isJSON(text)) {
        try {
            const obj = JSON.parse(text);
            const result = {} as Record<string, any>;
            for (const key of Object.keys(obj)) {
                const val = obj[key];
                result[key] = sanitizeObj(val, purifyConfig);
            }
            return result;
        } catch (e) {
            throw Error(e);
        }
    }
    return null;
};

const parseInstagram = (text: string) => {
    const metaMatch = /[\s\s]*?"og:description"\scontent="(?:(.*?) - )?[\s\S]+"/im.exec(text);
    const instgrmGQL = /:\{"PostPage":\[\{"graphql":([\s\S]+)\}\]\}/im.exec(text);
    if (instgrmGQL) {
        return {
            metaViews: metaMatch && DOMPurify.sanitize(metaMatch[1]),
            gqlData: instgrmGQL && JSON.parse(DOMPurify.sanitize(instgrmGQL[1])),
        };
    } else return null;
};
const parseChattypics = (text: string) => {
    const _resFragment = sanitizeToFragment(text) as DocumentFragment;
    const _resElemArr = _resFragment.querySelector("#allLinksDirect") as HTMLInputElement;
    const _resElemVal = _resFragment.querySelector("#link11") as HTMLInputElement;
    // return a list of links if applicable
    if (_resElemArr || _resElemVal) {
        return _resElemArr
            ? _resElemArr.value.split("\n").filter((x: string) => x !== "")
            : _resElemVal && [_resElemVal.value];
    } else return null;
};
const parseShackRSS = (rssText: string) => {
    const result: ShackRSSItem[] = [];
    if (rssText.startsWith('<?xml version="1.0" encoding="utf-8"?>')) {
        const items = rssText.match(/<item>([\s\S]+?)<\/item>/gim);
        for (const i of items || []) {
            const title = i.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/im);
            const link = i.match(/<link>(.+?)<\/link>/im);
            const date = i.match(/<pubDate>(.+?)<\/pubDate>/im);
            const content = i.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/im);
            const medialink = i.match(/<media:thumbnail url="(.+?)".*\/>/);
            const parsed: ShackRSSItem = {
                title: title ? DOMPurify.sanitize(title[1]) : "",
                link: link ? DOMPurify.sanitize(link[1]) : "",
                date: date ? DOMPurify.sanitize(date[1]) : new Date().toISOString(),
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
    const { chattyPics, instagram, chattyRSS, json, html }: ParseType = parseType || {};

    const _json = typeof json === "boolean" ? (json as boolean) : (json as PurifyConfig);
    const _html = typeof html === "boolean" ? (html as boolean) : (html as PurifyConfig);
    const jsonPurifyConfig = objHas(_json as PurifyConfig) && (_json as PurifyConfig);
    const htmlPurifyConfig = objHas(_html as PurifyConfig) && (_html as PurifyConfig);

    const text = await textPromise;
    try {
        if (instagram) {
            // sanitize Instagram graphQL cache to JSON
            return parseInstagram(text);
        } else if (chattyPics) {
            // sanitize ChattyPics response to array of links
            return parseChattypics(text);
        } else if (chattyRSS && text) {
            // sanitize and return as Shacknews RSS article list
            return parseShackRSS(text);
        } else if (html && text) {
            // explicitly sanitize (don't return fragment)
            return DOMPurify.sanitize(text) as string;
        } else if (isHTML(text) && htmlPurifyConfig) {
            // sanitize and return as DOM fragment (with optional DOMPurify config)
            return sanitizeToFragment(text, htmlPurifyConfig) as DocumentFragment;
        } else if (isHTML(text)) {
            return sanitizeToFragment(text) as DocumentFragment;
        } else if (isJSON(text) && jsonPurifyConfig) {
            const parsed = safeJSON(text, jsonPurifyConfig);
            if (parsed) return parsed;
        } else if (isJSON(text)) {
            // fallthrough: sanitize to JSON
            const parsed = safeJSON(text);
            if (parsed) return parsed;
        }
        // fallthrough: Gfycat (assume OK)
        else if (text.length === 0) return true;
    } catch (e) {
        if (e) console.error("Parse failed:", e);
        console.error("Parse failed!");
    }
    return null;
};
