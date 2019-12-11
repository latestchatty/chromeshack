const stripHtml = (html) => {
    // respect carriage returns
    let result = html.replace(/<br.*?>/gi, "\n");
    return result.replace(/(<([^>]+)>)/gi, "");
};

const insertStyle = (css, containerName) => {
    let style = document.querySelector(`style#${containerName}`) || document.createElement("style");
    if (!style.id) {
        style.type = "text/css";
        style.id = containerName;
        style.appendChild(document.createTextNode(css));
        document.getElementsByTagName("head")[0].appendChild(style);
    } else if (style.id) style.innerHTML = css;
};

const objContains = (needle, haystack) => {
    // tests if an object (or nested object) contains a matching value (or prop)
    // since objects can contains Arrays test for them too
    if (isEmpty(haystack)) return false;
    else if ((Array.isArray(haystack) && haystack.includes(needle)) || haystack === needle) return needle;
    for (let v of Object.values(haystack)) {
        if (v instanceof Object) {
            let _objResult = objContains(needle, v);
            if (_objResult) return _objResult;
        } else if (Array.isArray(v)) {
            let _arrResult = objContains(needle, {...v});
            if (_arrResult) return _arrResult;
        } else if (v === needle) {
            return v;
        }
    }
    return false;
};

const objContainsProperty = (key, obj) => Object.prototype.hasOwnProperty.call(obj, key);

const objConditionalFilter = (disallowed, obj) => {
    return Object.keys(obj)
        .filter((k) => !disallowed.includes(k))
        .reduce((o, k) => {
            return {...o, [k]: obj[k]};
        }, {});
};

const superTrim = (string) => {
    return string.replace(/^\s+|\s+$/g, "");
};

const isEmpty = (obj) => {
    return obj === null || obj === undefined || (obj && Object.keys(obj).length === 0 && obj.constructor === Object);
};

const xhrRequestLegacy = (url, optionsObj) => {
    // promisified legacy XHR helper using XMLHttpRequest()
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(!isEmpty(optionsObj) ? optionsObj.method : "GET", url);
        if (!isEmpty(optionsObj) && optionsObj.headers) {
            for (let [key, val] of Object.entries(optionsObj.headers)) {
                xhr.setRequestHeader(key, val);
            }
        }
        xhr.onload = () => {
            if ((this.status >= 200 && this.status < 300) || xhr.statusText.toUpperCase().indexOf("OK") > -1) {
                resolve(xhr.response);
            }
            reject({status: this.status, statusText: xhr.statusText});
        };
        xhr.onerror = () => {
            reject({status: this.status, statusText: xhr.statusText});
        };
        xhr.send();
    });
};

const fetchSafeLegacy = ({url, fetchOpts, parseType}) => {
    // used for sanitizing legacy fetches (takes type: [(JSON) | HTML])
    return new Promise((resolve, reject) => {
        xhrRequestLegacy(url, fetchOpts)
            .then((res) => {
                let result = res && parseFetchResponse(res, parseType);
                if (result) resolve(result);
                return reject(res);
            })
            .catch((err) => reject(err));
    });
};

const fetchSafe = ({url, fetchOpts, parseType}) => {
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
                let result =
                    res && (res.ok || res.statusText === "OK") && parseFetchResponse((await res).text(), parseType);
                if (result) return resolve(result);
                return reject(res);
            })
            .catch((err) => reject(err))
    );
};

const parseFetchResponse = async (textPromise, parseType) => {
    const {chattyPics, instagram, html, chattyRSS} = parseType || {};
    const text = await textPromise;
    try {
        // sanitize Instagram graphQL cache to JSON
        if (instagram) {
            let metaMatch = /[\s\s]*?"og:description"\scontent="(?:(.*?) - )?[\s\S]+"/im.exec(text);
            let instgrmGQL = /:\{"PostPage":\[\{"graphql":([\s\S]+)\}\]\}/im.exec(text);
            if (instgrmGQL)
                return {
                    metaViews: metaMatch && DOMPurify.sanitize(metaMatch[1]),
                    gqlData: instgrmGQL && JSON.parse(DOMPurify.sanitize(instgrmGQL[1]))
                };
        }
        // sanitize ChattyPics response to array of links
        else if (chattyPics) {
            let _resFragment = sanitizeToFragment(text);
            let _resElemArr = _resFragment.querySelector("#allLinksDirect");
            let _resElemVal = _resFragment.querySelector("#link11");
            // return a list of links if applicable
            if (_resElemArr || _resElemVal)
                return _resElemArr
                    ? _resElemArr.value.split("\n").filter((x) => x !== "")
                    : _resElemVal && [_resElemVal.value];
        }
        // sanitize and return as Shacknews RSS article list
        else if (chattyRSS && text) return parseShackRSS(text);
        // explicitly sanitize (don't return fragment)
        else if (html && text) return DOMPurify.sanitize(text);
        // sanitize and return as DOM fragment
        else if (isHTML(text)) return sanitizeToFragment(text);
        // fallthrough: sanitize to JSON
        else if (isJSON(text)) {
            let parsed = safeJSON(text);
            if (parsed) return parsed;
        }
        // fallthrough: Gfycat (assume OK)
        else if (text.length === 0) return true;
    } catch (err) {
        if (err) console.log("Parse failed:", err);
        console.log("Parse failed!");
    }
    return null;
};

const getCookieValue = (name, defaultValue) => {
    let ret = defaultValue | "";
    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let cookie = superTrim(cookies[i]).split("=");
        if (cookie[0] == name) {
            ret = cookie[1];
            break;
        }
    }
    return ret;
};

const generatePreview = (postText) => {
    // simple replacements
    //postText = postText.replace(/&/g, "&amp;"); // breaks Astral encoding
    postText = postText.replace(/</g, "&lt;");
    postText = postText.replace(/>/g, "&gt;");
    postText = postText.replace(/\r\n/g, "<br>");
    postText = postText.replace(/\n/g, "<br>");
    postText = postText.replace(/\r/g, "<br>");

    let complexReplacements = {
        red: {from: ["r{", "}r"], to: ['<span class="jt_red">', "</span>"]},
        green: {from: ["g{", "}g"], to: ['<span class="jt_green">', "</span>"]},
        blue: {from: ["b{", "}b"], to: ['<span class="jt_blue">', "</span>"]},
        yellow: {from: ["y{", "}y"], to: ['<span class="jt_yellow">', "</span>"]},
        olive: {from: ["e\\[", "\\]e"], to: ['<span class="jt_olive">', "</span>"]},
        lime: {from: ["l\\[", "\\]l"], to: ['<span class="jt_lime">', "</span>"]},
        orange: {from: ["n\\[", "\\]n"], to: ['<span class="jt_orange">', "</span>"]},
        pink: {from: ["p\\[", "\\]p"], to: ['<span class="jt_pink">', "</span>"]},
        quote: {from: ["q\\[", "\\]q"], to: ['<span class="jt_quote">', "</span>"]},
        sample: {from: ["s\\[", "\\]s"], to: ['<span class="jt_sample">', "</span>"]},
        strike: {from: ["-\\[", "\\]-"], to: ['<span class="jt_strike">', "</span>"]},
        italic1: {from: ["i\\[", "\\]i"], to: ["<i>", "</i>"]},
        italic2: {from: ["\\/\\[", "\\]\\/"], to: ["<i>", "</i>"]},
        bold1: {from: ["b\\[", "\\]b"], to: ["<b>", "</b>"]},
        bold2: {from: ["\\*\\[", "\\]\\*"], to: ["<b>", "</b>"]},
        underline: {from: ["_\\[", "\\]_"], to: ["<u>", "</u>"]},
        spoiler: {
            from: ["o\\[", "\\]o"],
            to: ['<span class="jt_spoiler" onclick="return doSpoiler(event);">', "</span>"]
        },
        code: {from: ["\\/{{", "}}\\/"], to: ['<pre class="jt_code">', "</pre>"]}
    };

    // replace matching pairs first
    for (let ix in complexReplacements) {
        let rgx = new RegExp(complexReplacements[ix].from[0] + "(.*?)" + complexReplacements[ix].from[1], "g");
        while (postText.match(rgx) !== null) {
            postText = postText.replace(rgx, complexReplacements[ix].to[0] + "$1" + complexReplacements[ix].to[1]);
        }
    }

    // replace orphaned opening shacktags, close them at the end of the post.
    // this still has (at least) one bug, the shack code does care about nested tag order:
    // b[g{bold and green}g]b <-- correct
    // b[g{bold and green]b}g <-- }g is not parsed by the shack code
    for (let ix in complexReplacements) {
        let rgx = new RegExp(complexReplacements[ix].from[0], "g");
        while (postText.match(rgx) !== null) {
            postText = postText.replace(rgx, complexReplacements[ix].to[0]);
            postText = postText + complexReplacements[ix].to[1];
        }
    }
    return convertUrlToLink(postText);
};

const debounce = (cb, delay) => {
    // even simpler debounce to prevent bugginess
    let _debounce;
    return function() {
        // don't use an arrow function here (we need 'this')
        const _cxt = this;
        const _args = arguments;
        clearTimeout(_debounce);
        _debounce = setTimeout(() => {
            cb.apply(_cxt, _args);
        }, delay);
    };
};

function scrollToElement(elem, toFitBool) {
    // don't use an arrow function here (for injection purposes)
    if (elem && typeof jQuery === "function" && elem instanceof jQuery) elem = elem[0];
    else if (!elem) return false;
    if (toFitBool) $("html, body").animate({scrollTop: $(elem).offset().top - 54}, 0);
    else $("html, body").animate({scrollTop: $(elem).offset().top - $(window).height() / 4}, 0);
}

function elementIsVisible(elem, partialBool) {
    // don't use an arrow function here (for injection purposes)
    // only check to ensure vertical visibility
    if (elem && typeof jQuery === "function" && elem instanceof jQuery) elem = elem[0];
    else if (!elem) return false;
    let rect = elem.getBoundingClientRect();
    let visibleHeight = window.innerHeight;
    if (partialBool) return rect.top <= visibleHeight && rect.top + rect.height >= 0;
    return rect.top >= 0 && rect.top + rect.height <= visibleHeight;
}

const elementFitsViewport = (elem) => {
    if (elem && typeof jQuery === "function" && elem instanceof jQuery) elem = elem[0];
    else if (!elem) return false;
    let elemHeight = elem.getBoundingClientRect().height;
    let visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight;
};

const convertUrlToLink = (text) => {
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target="_blank">$1</a>');
};

const removeChildren = (elem) => {
    // https://stackoverflow.com/a/42658543
    while (elem.hasChildNodes()) elem.removeChild(elem.lastChild);
};

const sanitizeToFragment = (html) => {
    return DOMPurify.sanitize(html, {RETURN_DOM_FRAGMENT: true, RETURN_DOM_IMPORT: true});
};

const safeInnerHTML = (text, targetNode) => {
    let sanitizedContent = sanitizeToFragment(text);
    let targetRange = document.createRange();
    targetRange.selectNodeContents(targetNode);
    targetRange.deleteContents();
    // replace innerHTML assign with sanitized insert
    targetRange.insertNode(sanitizedContent);
};

const safeJSON = (text) => {
    if (isJSON(text)) {
        let obj = JSON.parse(text);
        const iterate = (subval) => {
            if (Array.isArray(subval)) {
                for (let child of subval) child = DOMPurify.sanitize(child);
            } else if (typeof subval === Object) {
                for (let val of Object.values(subval)) subval = DOMPurify.sanitize(val);
            }
            return subval;
        };

        for (let val of Object.values(obj) || []) {
            if (Array.isArray(val) || typeof val === Object) val = iterate(val);
            else val = DOMPurify.sanitize(val);
        }
        return obj;
    }
    return null;
};

const parseShackRSS = (rssText) => {
    let result = [];
    if (rssText.startsWith('<?xml version="1.0" encoding="utf-8"?>')) {
        let items = rssText.match(/<item>([\s\S]+?)<\/item>/gim);
        for (let i of items || []) {
            let title = i.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/im);
            let link = i.match(/<link>(.+?)<\/link>/im);
            let date = i.match(/<pubDate>(.+?)<\/pubDate>/im);
            let content = i.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/im);
            let medialink = i.match(/<media:thumbnail url="(.+?)".*\/>/);
            result.push({
                title: title ? DOMPurify.sanitize(title[1]) : "",
                link: link ? DOMPurify.sanitize(link[1]) : "",
                date: date ? DOMPurify.sanitize(date[1]) : new Date().toISOString(),
                content: content ? DOMPurify.sanitize(content[1]) : "",
                medialink: medialink ? DOMPurify.sanitize(medialink[1]) : ""
            });
        }
    }
    // sanitize our resulting response
    if (!isEmpty(result)) return result;
    return null;
};

const isHTML = (text) => {
    // https://stackoverflow.com/a/15458968
    if (!text || (text && isJSON(text))) return false;
    let doc = new DOMParser().parseFromString(text, "text/html");
    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
};

const isJSON = (text) => {
    try {
        if (text && JSON.parse(text)) return true;
    } catch (err) {
        return false;
    }
};

const FormDataToJSON = async (fd) => {
    const FileToObject = async (fileData) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileData);
        return new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    };

    let _fd = [];
    for (let [k, v] of fd) {
        let _file = await FileToObject(v);
        _fd.push({key: k, filename: v.name, data: _file});
    }
    return JSON.stringify(_fd);
};

const JSONToFormData = (jsonStr) => {
    const Base64ToFile = (filename, baseStr) => {
        // https://stackoverflow.com/a/5100158
        let byteString;
        if (baseStr.split(",")[0].indexOf("base64") >= 0) byteString = atob(baseStr.split(",")[1]);
        else byteString = unescape(baseStr.split(",")[1]);

        // separate out the mime component
        let mimeString = baseStr
            .split(",")[0]
            .split(":")[1]
            .split(";")[0];
        // write the bytes of the string to a typed array
        let ia = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new File([ia], filename, {type: mimeString});
    };

    let _obj = JSON.parse(jsonStr);
    let _fd = new FormData();
    for (let v of Object.values(_obj)) {
        let _file = Base64ToFile(v.filename, v.data);
        _fd.append(v.key, _file);
    }
    if (!_fd.entries().next().done) return _fd;
    return null;
};

const collapseThread = (id) => {
    let MAX_LENGTH = 100;
    getSetting("collapsed_threads", []).then((collapsed) => {
        if (collapsed.indexOf(id) < 0) {
            collapsed.unshift(id);
            // remove a bunch if it gets too big
            if (collapsed.length > MAX_LENGTH * 1.25) collapsed.splice(MAX_LENGTH);
            setSetting("collapsed_threads", collapsed);
        }
    });
};

const unCollapseThread = (id) => {
    getSetting("collapsed_threads", []).then((collapsed) => {
        let index = collapsed.indexOf(id);
        if (index >= 0) {
            collapsed.splice(index, 1);
            setSetting("collapsed_threads", collapsed);
        }
    });
};

const locatePostRefs = (elem)  => {
    if (elem) {
        let root = elem.closest(".root");
        let closestContainer = root.closest("li[id^='item_']");
        let post = closestContainer && !closestContainer.matches(".root > ul > li") ?
            closestContainer :
            root.querySelector("li li.sel");
        return {post, root: root.querySelector("ul > li")};
    }
    return null;
};

const elementMatches = (elem, selector) => elem && elem.nodeType !== 3 && elem.matches(selector) ? elem : null;

const elementQuerySelector = (elem, selector) => elem && elem.nodeType !== 3 ? elem.querySelector(selector) : null;

const elementQuerySelectorAll = (elem, selector) => elem && elem.nodeType !== 3 ? elem.querySelectorAll(selector) : null;
