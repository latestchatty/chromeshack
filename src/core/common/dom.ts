import DOMPurify from "dompurify";
import jQuery from "jquery";
import * as textFieldEdit from "text-field-edit";
import { arrHas } from "./";
import type { PurifyConfig } from "./fetch";

const $ = jQuery;

export interface PreviewReplacements {
    [propName: string]: {
        from: string[];
        to: string[];
    };
}

export const stripHtml = (html: string) => {
    // respect carriage returns
    const result = html.replace(/<br.*?>/gi, "\n");
    return result.replace(/(<([^>]+)>)/gi, "");
};

export const superTrim = (input: string) => {
    return input.replace(/^[\h\r\n]+|[\h\r\n]+$/gm, "");
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

export const convertUrlToLink = (text: string) => {
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target="_blank">$1</a>');
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
    else
        $("html, body").animate(
            {
                scrollTop: $(elem).offset().top - $(window).height() / 4,
            },
            0,
        );
}

export const scrollParentToChild = (parent: HTMLElement, child: HTMLElement) => {
    // https://stackoverflow.com/a/45411081
    const parentRect = parent.getBoundingClientRect();
    const parentViewableArea = {
        height: parent.clientHeight,
        width: parent.clientWidth,
    };
    const childRect = child.getBoundingClientRect();
    const isViewable = childRect.top >= parentRect.top && childRect.top <= parentRect.top + parentViewableArea.height;
    if (!isViewable) parent.scrollTop = childRect.top + parent.scrollTop - parentRect.top;
};

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

export function elementFitsViewport(elem: JQuery<HTMLElement> | HTMLElement) {
    if (elem && elem instanceof $) elem = (elem as JQuery<HTMLElement>)[0] as HTMLElement;
    else if (!elem) return false;
    const elemHeight = (elem as HTMLElement).getBoundingClientRect().height;
    const visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight;
}

export const removeChildren = (elem: HTMLElement) => {
    // https://stackoverflow.com/a/42658543
    while (elem.hasChildNodes()) elem.removeChild(elem.lastChild);
};

export const sanitizeToFragment = (html: string, purifyConfig?: PurifyConfig) => {
    const config = {
        RETURN_DOM_FRAGMENT: true,
        RETURN_DOM_IMPORT: true,
        ...purifyConfig,
    };
    return DOMPurify.sanitize(html, config) as DocumentFragment;
};

export const safeInnerHTML = (text: string, targetNode: HTMLElement) => {
    const sanitizedContent = sanitizeToFragment(text);
    const targetRange = document.createRange();
    targetRange.selectNodeContents(targetNode);
    targetRange.deleteContents();
    // replace innerHTML assign with sanitized insert
    targetRange.insertNode(sanitizedContent);
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

export const appendLinksToField = (field: HTMLInputElement, links: string[]) => {
    /// try to append links to the bottom of text input field
    if (!field || field.value === undefined) return console.error("invalid field target:", field);
    const constructed: string = arrHas(links)
        ? links
              .reduce((pv, v, i) => {
                  // make sure we leave space after the link text is inserted
                  if (i === 0 && field.value.length > 0) pv.push(`\n${v}\n`);
                  else pv.push(`${v}\n`);
                  return pv;
              }, [])
              .join("")
        : null;
    if (constructed) textFieldEdit.insert(field, constructed);
};

export const matchFileFormat = (input: File, imgFormats: string, vidFormats: string): number => {
    /// compares a File to image and video mime-type strings to determine general file type
    const _imgFormats = imgFormats && imgFormats.length > 0 ? imgFormats.split(",") : null;
    const _vidFormats = vidFormats && vidFormats.length > 0 ? vidFormats.split(",") : null;
    if (!_imgFormats && !_vidFormats) return -1;
    const _imgMatched = arrHas(_imgFormats) && _imgFormats.filter((fmt) => fmt === input.type);
    const _vidMatched = arrHas(_vidFormats) && _vidFormats.filter((fmt) => fmt === input.type);
    if (_imgMatched) return 0;
    else if (_vidMatched) return 1;
    return -1;
};

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
export const elemMatches = (elem: HTMLElement, selector: string) => {
    if (!elem || elem.nodeType === 3 || !elem.matches) return null;
    else if (elem?.matches(selector)) return elem;
};

/// takes an Element of a post and returns post/root information
export interface PostRefs {
    post: HTMLElement;
    postid: string;
    root: HTMLElement;
    rootid: string;
    is_root: boolean;
}
export const locatePostRefs = (postElem: HTMLElement) => {
    if (!postElem) return null;
    const _parent = postElem.parentNode as HTMLElement;
    const post = elemMatches(_parent, "li.sel") || (postElem?.closest && (postElem?.closest("li.sel") as HTMLElement));
    const root = postElem.classList?.contains("op")
        ? (postElem.parentNode.parentNode.parentNode as HTMLElement)
        : (post?.closest(".root > ul > li") as HTMLElement) || (post?.querySelector(".root > ul > li") as HTMLElement);
    const postid = post?.id?.substr(5);
    const rootid = root?.id?.substr(5);
    const is_root = rootid && postid && rootid === postid;
    return { post, postid, root, rootid, is_root };
};

export const decodeHTML = (text: string) => {
    // warning! make sure to sanitize before decoding!
    const ta = document.createElement("p");
    if (text) ta.innerHTML = text;
    return ta.textContent || text;
};

export const encodeHTML = (text: string) => {
    // warning! make sure to sanitize before encoding!
    const ta = document.createElement("p");
    if (text) ta.textContent = text;
    return ta.innerHTML || text;
};

export const disableTwitch = () => {
    const twitch = document.querySelector(".featured-article-content iframe");
    const _p = twitch?.closest("p");
    if (twitch) {
        twitch.parentNode.removeChild(twitch);
        _p?.parentNode?.removeChild(_p);
    }
};
