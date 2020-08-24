import DOMPurify from "dompurify";
import $ from "jquery";

import { CS_Instance } from "../content";

export interface ShackRSSItem {
    title: string;
    link: string;
    date: string;
    content: string;
    medialink: string;
}

export interface FetchArgs {
    url: string;
    fetchOpts?: RequestInit | {};
    parseType?: object | {};
}

export interface ParseType {
    chattyPics?: boolean;
    chattyRSS?: boolean;
    html?: boolean;
    instagram?: boolean;
}

interface PreviewReplacement {
    from: string[];
    to: string[];
}
interface PreviewReplacements {
    [key: string]: PreviewReplacement;
}

export const stripHtml = (html: string) => {
    // respect carriage returns
    const result = html.replace(/<br.*?>/gi, "\n");
    return result.replace(/(<([^>]+)>)/gi, "");
};

export const insertStyle = (css: string, containerName: string) => {
    const style = document.querySelector(`style#${containerName}`) || document.createElement("style");
    if (!style.id) {
        style.setAttribute("type", "text/css");
        style.setAttribute("id", containerName);
        style.appendChild(document.createTextNode(css));
        document.getElementsByTagName("head")[0].appendChild(style);
    } else if (style.id) style.innerHTML = css;
};

export const arrHas = (arr: any[]) => arr && Array.isArray(arr) && arr.length > 0;
export const arrEmpty = (arr: any[]) => arr && Array.isArray(arr) && arr.length === 0;
export const objHas = (obj: Record<string, any>) => obj && typeof obj === "object" && Object.keys(obj).length > 0;
export const objEmpty = (obj: Record<string, any>) => obj && typeof obj === "object" && Object.keys(obj).length === 0;

export const objContains = (needle: any, haystack: any) => {
    /// tests for object equality in a nested object
    if (!haystack || arrEmpty(haystack as string[]) || objEmpty(haystack as Record<string, any>)) return null;
    if (needle === haystack) return needle as string;
    else if (arrHas(haystack as string[])) return (haystack as string[]).find((x) => x === needle) || null;
    for (const k of Object.keys(haystack as Record<string, any>) || []) {
        const value = haystack[k];
        if (arrHas(value)) {
            const result = objContains(needle, value) as string;
            if (result) return result;
        } else if (typeof value === "object") {
            const result = objContains(needle, value) as string;
            if (result) return result;
        } else if (value === needle) return value;
    }
    return null;
};

export const objContainsProperty = (key: string, obj: object) => Object.prototype.hasOwnProperty.call(obj, key);

export const superTrim = (input: string) => {
    return input.replace(/^\s+|\s+$/g, "");
};

export const xhrRequestLegacy = (url: string, optionsObj?: RequestInit) => {
    // promisified legacy XHR helper using XMLHttpRequest()
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(!objEmpty(optionsObj) ? optionsObj.method : "GET", url);
        if (!objEmpty(optionsObj) && optionsObj.headers) {
            const headers = optionsObj.headers as Record<string, any>;
            for (const key of Object.keys(headers) || []) {
                const value = headers[key] as string;
                xhr.setRequestHeader(key, value);
            }
        }

        xhr.onload = function () {
            if ((this.status >= 200 && this.status < 300) || xhr.statusText.toUpperCase().indexOf("OK") > -1)
                resolve(xhr.response);

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
                return reject(res);
            })
            .catch((err) => reject(err));
    });
};

export const fetchSafe = ({ url, fetchOpts, parseType }: FetchArgs): Promise<any> => {
    // used for sanitizing fetches
    // fetchOpts gets destructured in 'xhrRequest()'
    // modeObj gets destructured into override bools:
    //   instgrmBool: for embedded instagram graphQL parsing
    //   htmlBool: to force parsing as HTML fragment
    //   rssBool: to force parsing RSS to a sanitized JSON object
    // NOTE: HTML type gets sanitized to a document fragment
    return new Promise((resolve, reject) =>
        fetch(url, fetchOpts)
            .then(async (res) => {
                const result = (res?.ok || res?.statusText === "OK") && res.text();
                const parsed = result ? parseFetchResponse(result, parseType) : null;
                if (parsed) return resolve(parsed);
                return reject(res);
            })
            .catch((err) => reject(err)),
    );
};

const waitToResolve = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const waitToFetchSafe = async (timeout: number, fetchArgs: FetchArgs) => {
    await waitToResolve(timeout);
    return await fetchSafe(fetchArgs);
};

export const parseFetchResponse = async (textPromise: Promise<string>, parseType: ParseType) => {
    const { chattyPics, instagram, html, chattyRSS }: ParseType = parseType || {};
    const text = await textPromise;
    try {
        // sanitize Instagram graphQL cache to JSON
        if (instagram) {
            const metaMatch = /[\s\s]*?"og:description"\scontent="(?:(.*?) - )?[\s\S]+"/im.exec(text);
            const instgrmGQL = /:\{"PostPage":\[\{"graphql":([\s\S]+)\}\]\}/im.exec(text);
            if (instgrmGQL) {
                return {
                    metaViews: metaMatch && DOMPurify.sanitize(metaMatch[1]),
                    gqlData: instgrmGQL && JSON.parse(DOMPurify.sanitize(instgrmGQL[1])),
                };
            }
        }
        // sanitize ChattyPics response to array of links
        else if (chattyPics) {
            const _resFragment = sanitizeToFragment(text) as DocumentFragment;
            const _resElemArr = _resFragment.querySelector("#allLinksDirect") as HTMLInputElement;
            const _resElemVal = _resFragment.querySelector("#link11") as HTMLInputElement;
            // return a list of links if applicable
            if (_resElemArr || _resElemVal) {
                return _resElemArr
                    ? _resElemArr.value.split("\n").filter((x: string) => x !== "")
                    : _resElemVal && [_resElemVal.value];
            }
        }
        // sanitize and return as Shacknews RSS article list
        else if (chattyRSS && text) return parseShackRSS(text);
        // explicitly sanitize (don't return fragment)
        else if (html && text) return DOMPurify.sanitize(text) as string;
        // sanitize and return as DOM fragment
        else if (isHTML(text)) return sanitizeToFragment(text) as DocumentFragment;
        // fallthrough: sanitize to JSON
        else if (isJSON(text)) {
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

export const getCookieValue = (name: string, defaultValue: string) => {
    let ret = defaultValue || "";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = superTrim(cookies[i]).split("=");
        if (cookie[0] == name) {
            ret = cookie[1];
            break;
        }
    }
    return ret;
};

export const generatePreview = (postText: string) => {
    // simple replacements
    postText = postText.replace(/</g, "&lt;");
    postText = postText.replace(/>/g, "&gt;");
    postText = postText.replace(/\r\n|\n|\r/g, "<br>");
    const complexReplacements: PreviewReplacements = {
        red: { from: ["r{", "}r"], to: ['<span class="jt_red">', "</span>"] },
        green: {
            from: ["g{", "}g"],
            to: ['<span class="jt_green">', "</span>"],
        },
        blue: { from: ["b{", "}b"], to: ['<span class="jt_blue">', "</span>"] },
        yellow: {
            from: ["y{", "}y"],
            to: ['<span class="jt_yellow">', "</span>"],
        },
        olive: {
            from: ["e\\[", "\\]e"],
            to: ['<span class="jt_olive">', "</span>"],
        },
        lime: {
            from: ["l\\[", "\\]l"],
            to: ['<span class="jt_lime">', "</span>"],
        },
        orange: {
            from: ["n\\[", "\\]n"],
            to: ['<span class="jt_orange">', "</span>"],
        },
        pink: {
            from: ["p\\[", "\\]p"],
            to: ['<span class="jt_pink">', "</span>"],
        },
        quote: {
            from: ["q\\[", "\\]q"],
            to: ['<span class="jt_quote">', "</span>"],
        },
        sample: {
            from: ["s\\[", "\\]s"],
            to: ['<span class="jt_sample">', "</span>"],
        },
        strike: {
            from: ["-\\[", "\\]-"],
            to: ['<span class="jt_strike">', "</span>"],
        },
        italic1: { from: ["i\\[", "\\]i"], to: ["<i>", "</i>"] },
        italic2: { from: ["\\/\\[", "\\]\\/"], to: ["<i>", "</i>"] },
        bold1: { from: ["b\\[", "\\]b"], to: ["<b>", "</b>"] },
        bold2: { from: ["\\*\\[", "\\]\\*"], to: ["<b>", "</b>"] },
        underline: { from: ["_\\[", "\\]_"], to: ["<u>", "</u>"] },
        spoiler: {
            from: ["o\\[", "\\]o"],
            to: ['<span class="jt_spoiler" onclick="return doSpoiler(event);">', "</span>"],
        },
        code: {
            from: ["\\/{{", "}}\\/"],
            to: ['<pre class="codeblock">', "</span>"],
        },
    };

    // replace matching pairs first
    for (const ix in complexReplacements) {
        const rgx = new RegExp(complexReplacements[ix].from[0] + "(.*?)" + complexReplacements[ix].from[1], "g");
        while (postText.match(rgx) !== null)
            postText = postText.replace(rgx, complexReplacements[ix].to[0] + "$1" + complexReplacements[ix].to[1]);
    }

    // replace orphaned opening shacktags, close them at the end of the post.
    // this still has (at least) one bug, the shack code does care about nested tag order:
    // b[g{bold and green}g]b <-- correct
    // b[g{bold and green]b}g <-- }g is not parsed by the shack code
    for (const ix in complexReplacements) {
        const rgx = new RegExp(complexReplacements[ix].from[0], "g");
        while (postText.match(rgx) !== null) {
            postText = postText.replace(rgx, complexReplacements[ix].to[0]);
            postText = postText + complexReplacements[ix].to[1];
        }
    }
    return convertUrlToLink(postText);
};

export function scrollToElement(elem: JQuery<HTMLElement> | HTMLElement, toFitBool?: boolean) {
    // don't use an arrow function here (for injection purposes)
    if (elem && elem instanceof $) elem = (elem as JQuery<HTMLElement>)[0] as HTMLElement;
    else if (!elem) return false;
    if (toFitBool) $("html, body").animate({ scrollTop: $(elem).offset().top - 54 }, 0);
    else {
        $("html, body").animate(
            {
                scrollTop: $(elem).offset().top - $(window).height() / 4,
            },
            0,
        );
    }
}

export function elementIsVisible(elem: JQuery<HTMLElement> | HTMLElement, partialBool?: boolean) {
    // don't use an arrow function here (for injection purposes)
    // only check to ensure vertical visibility
    if (elem && elem instanceof $) elem = (elem as JQuery<HTMLElement>)[0] as HTMLElement;
    else if (!elem) return false;
    const rect = (elem as HTMLElement).getBoundingClientRect();
    const visibleHeight = window.innerHeight;
    if (partialBool) return rect.top <= visibleHeight && rect.top + rect.height >= 0;
    return rect.top >= 0 && rect.top + rect.height <= visibleHeight;
}

export const elementFitsViewport = (elem: JQuery<HTMLElement> | HTMLElement) => {
    if (elem && elem instanceof $) elem = (elem as JQuery<HTMLElement>)[0] as HTMLElement;
    else if (!elem) return false;
    const elemHeight = (elem as HTMLElement).getBoundingClientRect().height;
    const visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight;
};

export const convertUrlToLink = (text: string) => {
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target="_blank">$1</a>');
};

export const removeChildren = (elem: HTMLElement) => {
    // https://stackoverflow.com/a/42658543
    while (elem.hasChildNodes()) elem.removeChild(elem.lastChild);
};

export const sanitizeToFragment = (html: string) => {
    return DOMPurify.sanitize(html, {
        RETURN_DOM_FRAGMENT: true,
        RETURN_DOM_IMPORT: true,
    });
};

export const safeInnerHTML = (text: string, targetNode: HTMLElement) => {
    const sanitizedContent = sanitizeToFragment(text);
    const targetRange = document.createRange();
    targetRange.selectNodeContents(targetNode);
    targetRange.deleteContents();
    // replace innerHTML assign with sanitized insert
    targetRange.insertNode(sanitizedContent);
};

export const safeJSON = (text: string) => {
    if (isJSON(text)) {
        try {
            const obj = JSON.parse(text);
            const result = {} as Record<string, any>;
            const iterate = (val: any) => {
                if (val && Array.isArray(val)) {
                    const _arr = [] as any[];
                    for (const subval of val) _arr.push(iterate(subval));
                    return _arr;
                } else if (val && typeof val === "object" && Object.keys(val).length > 0) {
                    const _obj = {} as Record<string, any>;
                    for (const key in val) _obj[key] = iterate(val[key]);
                    return _obj;
                } else {
                    if (val === null) return null;
                    if (typeof val === "boolean" && val) return true;
                    if (typeof val === "boolean" && !val) return false;
                    else return DOMPurify.sanitize(val);
                }
            };

            for (const key of Object.keys(obj)) {
                const val = obj[key];
                result[key] = iterate(val);
            }
            return result;
        } catch (e) {
            throw Error(e);
        }
    }
    return null;
};

export const parseShackRSS = (rssText: string): object[] => {
    const result = [];
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
    if (!arrEmpty(result)) return result;
    return null;
};

export const isHTML = (text: string) => {
    // https://stackoverflow.com/a/15458968
    if (!text || (text && isJSON(text))) return false;
    const doc = new DOMParser().parseFromString(text, "text/html");
    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
};

export const isJSON = (text: string) => {
    try {
        if (text && JSON.parse(text)) return true;
    } catch (err) {
        return false;
    }
};

export const FormDataToJSON = async (fd: FormData) => {
    const FileToObject = async (fileData: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileData);
        return new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    };

    const _fd = [];
    for (const [k, v] of fd) {
        const _file = v instanceof File && (await FileToObject(v));
        if (_file) _fd.push({ key: k, filename: (v as File).name, data: _file });
        else _fd.push({ key: k, value: v });
    }
    return JSON.stringify(_fd);
};

export const JSONToFormData = (jsonStr: string) => {
    const Base64ToFile = (filename: string, baseStr: string) => {
        // https://stackoverflow.com/a/5100158
        let byteString;
        if (baseStr.split(",")[0].indexOf("base64") >= 0) byteString = atob(baseStr.split(",")[1]);
        else byteString = unescape(baseStr.split(",")[1]);

        // separate out the mime component
        const mimeString = baseStr.split(",")[0].split(":")[1].split(";")[0];
        // write the bytes of the string to a typed array
        const ia = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

        return new File([ia], filename, { type: mimeString });
    };

    const _obj = JSON.parse(jsonStr);
    const _fd = new FormData();
    for (const key of Object.keys(_obj)) {
        const _file = _obj[key].data?.startsWith("data:") && Base64ToFile(_obj[key].filename, _obj[key].data);
        if (_file) _fd.append(_obj[key].key, _file);
        else _fd.append(_obj[key].key, _obj[key].value);
    }
    if (!_fd.entries().next().done) return _fd;
    return null;
};

export const insertAtCaret = (field: HTMLInputElement, text: string) => {
    if (field.selectionStart || field.selectionStart === 0) {
        const startPos = field.selectionStart || 0;
        const endPos = field.selectionEnd || 0;
        field.value = field.value.substring(0, startPos) + text + field.value.substring(endPos, field.value.length);
        field.selectionStart = startPos + text.length;
        field.selectionEnd = startPos + text.length;
    } else field.value += text;
};

export const appendLinksToField = (field: HTMLInputElement, links: string[]) => {
    /// try to append links to the bottom of text input field
    const constructed: string = !arrEmpty(links)
        ? links
              .reduce((pv, v, i) => {
                  if (i === 0 && field.value.length > 0) pv.push(`\n\n${v}`);
                  else pv.push(v);
                  return pv;
              }, [])
              .join("")
        : null;
    if (constructed) insertAtCaret(field, constructed);
};

export const getFileCount = (fileList: FileList | File[]) => {
    const files = typeof fileList === "object" && !Array.isArray(fileList) ? [...fileList] : fileList;
    return files && files.length > 0 ? `${files.length} files` : "";
};

export const matchFileFormat = (input: File, imgFormats: string, vidFormats: string): number => {
    /// compares a File to image and video mime-type strings to determine general file type
    const _imgFormats = imgFormats && imgFormats.length > 0 ? imgFormats.split(",") : null;
    const _vidFormats = vidFormats && vidFormats.length > 0 ? vidFormats.split(",") : null;
    if (!_imgFormats && !_vidFormats) return -1;
    const _imgMatched = !arrEmpty(_imgFormats) && _imgFormats.filter((fmt) => fmt === input.type);
    const _vidMatched = !arrEmpty(_vidFormats) && _vidFormats.filter((fmt) => fmt === input.type);
    if (_imgMatched) return 0;
    else if (_vidMatched) return 1;
    return -1;
};

export const packValidTypes = (types: string, fileList: File[] | FileList) => {
    /// only include files that match a mime type list
    // a string with comma delimited mime types
    const typeArr = types.split(",");
    // returns a File array with only matching file types in it
    const files: File[] = [...fileList].filter((f) => typeArr.includes(f.type));
    return files;
};

export const isUrlArr = (dataArr: string[]) => {
    // every element of this array must contain a URL formatted string
    for (const i of dataArr || [])
        if (typeof i !== "string" || i.length <= 9 || !i.match(/^https?:\/\//i)) return false;
    return true;
};

export const isFileArr = (dataArr: any[]) => {
    // every element of this array must contain a File object
    for (const i of dataArr || []) if (!(i instanceof File)) return false;
    return true;
};

export const classNames = (...args: any[]) => {
    /// pass a string or object to assemble classes based on truthiness
    /// e.g.: classNames("a", { very: true, convenient: true, function: false });
    /// produces: "a very convenient"
    const result = [];
    for (const arg of args) {
        if (typeof arg === "object" && arg !== null) {
            const keys = Object.keys(arg);
            for (const k of keys) if (arg[k]) result.push(k);
        } else if (typeof arg === "string" && arg !== null && arg) result.push(arg);
    }
    return !arrEmpty(result) ? result.join(" ") : "";
};

export const isVideo = (href: string) => /\.(mp4|gifv|webm)|(mp4|webm)$/i.test(href);
export const isImage = (href: string) => /\.(jpe?g|gif|png|webp)|(jpe?g|gif|png|webp)$/i.test(href);

export const afterElem = (siblingElem: HTMLElement, elem: HTMLElement) => {
    /// check if we are a successor of a sibling in a node list
    if (!siblingElem || !elem) return false;
    let siblingPos = 0;
    const children = [...elem?.parentNode.childNodes];
    for (let i = 0; i < children?.length && children?.length > 0; i++) {
        const child = children[i] as HTMLElement;
        // stop short if we get a match
        if (siblingElem === child) siblingPos = i;
        else if (elem === child && i > siblingPos) return true;
    }
    return false;
};

/// checks if a non-text node is a matching Element
export const elemMatches = (elem: HTMLElement, selector: string) =>
    elem?.nodeType !== 3 && elem?.matches(selector) && elem;

/// takes an Element of a post and returns post/root information
export const locatePostRefs = (postElem: HTMLElement) => {
    if (!postElem) return null;
    // match the first fullpost container (up/cur first, then down)
    const post = postElem?.closest("li.sel") as HTMLElement;
    const root = post?.closest(".root > ul > li") as HTMLElement;
    const is_root = !!elemMatches(post, ".root > ul > li");
    const rootid = root?.id?.substr(5);
    const postid = post?.id?.substr(5);
    const result = { post, postid, root, rootid, is_root };
    if (CS_Instance.debugEvents) console.log("locatePostRefs:", result);
    return result;
};
