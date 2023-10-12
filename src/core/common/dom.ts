import jQuery from "jquery";
import * as textFieldEdit from "text-field-edit";
import { arrHas } from "./common";

const $ = jQuery;

export const stripHtml = (html: string) => {
    // respect carriage returns
    const result = html.replace(/<br.*?>/gi, "\n");
    return result.replace(/(<([^>]+)>)/gi, "");
};

export const superTrim = (input: string) => {
    return input.replace(/^[\h\r\n]+|[\h\r\n]+$/gm, "");
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
    const urlRgx = /((ftp|https?):\/\/([\w-]+(\:[\w-]+)?@)?(.+?\.)?([\w-]+\.[\w-]{2,4}(?:\:\d+)?|.+?)\/?[^\s{}<>()]+\b)/gi;
    return text.replace(urlRgx, (m, m1) => {
        return `<a href="${m1}" target="_blank" rel="noopener noreferrer">${m1}</a>`;
    });
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
            to: ['<span class="jt_spoiler">', "</span>"],
        },
        code: {
            from: ["\\/{{", "}}\\/"],
            to: ['<pre class="jt_code">', "</pre>"],
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

export function scrollToElement(
    elem: JQuery<HTMLElement> | HTMLElement,
    opts?: { offset?: number; smooth?: boolean; toFit?: boolean },
) {
    const { offset, smooth, toFit } = opts || {};
    if (elem && elem instanceof $) elem = (elem as JQuery<HTMLElement>)[0] as HTMLElement;
    else if (!elem) return false;
    const headerHeight = -(document.querySelector("header")?.getBoundingClientRect().height + 6);
    const _offset = offset === undefined ? headerHeight : offset;
    // position visibly by default - use offset if 'toFit'
    const visibleY = toFit ? _offset : -($(window).height() / 4);
    const scrollY = (elem as HTMLElement).getBoundingClientRect().top + window.scrollY + visibleY;
    window.scrollTo({ top: scrollY, behavior: smooth ? "smooth" : "auto" });
}

export const scrollParentToChild = (parent: HTMLElement, child: HTMLElement, offset?: number) => {
    // https://stackoverflow.com/a/45411081
    const parentRect = parent.getBoundingClientRect();
    const parentViewableArea = {
        height: parent.clientHeight,
        width: parent.clientWidth,
    };
    const _offset = offset || -10;
    const childRect = child.getBoundingClientRect();
    const isViewable = childRect.top >= parentRect.top && childRect.top <= parentRect.top + parentViewableArea.height;
    if (!isViewable) parent.scrollTop = childRect.top + parent.scrollTop - parentRect.top + _offset;
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
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height + 6;
    const elemHeight = (elem as HTMLElement).getBoundingClientRect().height;
    const visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight - headerHeight;
}

export const removeChildren = (elem: HTMLElement) => {
    // https://stackoverflow.com/a/42658543
    while (elem.hasChildNodes()) elem.removeChild(elem.lastChild);
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
    if (elem != null && elem.nodeType !== 3 && elem.matches && elem.matches(selector)) return elem;
    return null;
};

/// takes an Element of a post and returns post/root information
export const locatePostRefs = (postElem: HTMLElement) => {
    if (!postElem) return null;
    const _parent = postElem.parentNode as HTMLElement;
    const post = elemMatches(_parent, "li.sel") || (postElem?.closest && (postElem?.closest("li.sel") as HTMLElement));
    const root = postElem.classList?.contains("op")
        ? (postElem.parentNode.parentNode.parentNode as HTMLElement)
        : (post?.closest(".root > ul > li") as HTMLElement) || (post?.querySelector(".root > ul > li") as HTMLElement);
    const postid = parseInt(post?.id?.substr(5));
    const rootid = parseInt(root?.id?.substr(5));
    const is_root = rootid && postid && rootid === postid;
    return { post, postid, root, rootid, is_root } as PostEventArgs;
};

export const disableTwitch = () => {
    const twitch = document.querySelector(".featured-article-content iframe");
    const _p = twitch?.closest("p");
    if (twitch) {
        twitch.parentNode.removeChild(twitch);
        _p?.parentNode?.removeChild(_p);
    }
};

export const parseToElement = (html: string) => {
    // NOTE: DOMParser is picky about its HTML-text input
    const noTrailingSpaces = html.replace(/^\s*|\s*$/, "");
    const parsed = new DOMParser().parseFromString(noTrailingSpaces, "text/html");
    return parsed.querySelector("style") || parsed.body.firstElementChild || null;
};

export const decodeHTML = (text: string) => {
    // decode unicode entities from text by reading off an element
    const p = parseToElement(/*html*/ `<p>${text}</p>`);
    return p.textContent || "";
};

export const insertStyle = (css: string, containerName: string) => {
    const existing = document.getElementById(containerName);
    if (existing) existing.parentElement.removeChild(existing);
    const _style = document.createElement("style");
    _style.setAttribute("id", containerName);
    _style.textContent = css;
    document.querySelector("head")?.append(_style);
};

export const openAsWindow = (href: string) => {
    const newWindow = window.open(href, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
};
