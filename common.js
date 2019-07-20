const getDescendentByTagAndClassName = (parent, tag, class_name) => {
    let descendents = parent.getElementsByTagName(tag);
    for (let i = 0; i < descendents.length; i++) {
        if (descendents[i].className.indexOf(class_name) == 0) return descendents[i];
    }
};

const getDescendentByTagAndAnyClassName = (parent, tag, class_name) => {
    let descendents = parent.getElementsByTagName(tag);
    for (let i = 0; i < descendents.length; i++) {
        if (descendents[i].className.indexOf(class_name) !== -1) return descendents[i];
    }
};

const getDescendentsByTagAndClassName = (parent, tag, class_name) => {
    let descendents = parent.getElementsByTagName(tag);
    let descArray = new Array();
    for (let i = 0; i < descendents.length; i++) {
        if (descendents[i].className.indexOf(class_name) == 0) descArray.push(descendents[i]);
    }

    return descArray;
};

const getDescendentsByTagAndAnyClassName = (parent, tag, class_name) => {
    let descendents = parent.getElementsByTagName(tag);
    let descArray = new Array();
    for (let i = 0; i < descendents.length; i++) {
        if (descendents[i].className.indexOf(class_name) !== -1) descArray.push(descendents[i]);
    }

    return descArray;
};

const stripHtml = html => {
    return String(html).replace(/(<([^>]+)>)/gi, "");
};

const insertStyle = (css, containerName) => {
    let style = document.getElementById(containerName) || document.createElement("style");
    if (!style.id) {
        style.type = "text/css";
        style.id = containerName;
    }
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName("head")[0].appendChild(style);
};

const objContains = (needle, haystack) => {
    // tests if an object (or nested object) contains a matching value (or prop)
    // since objects can contains Arrays test for them too
    if (isEmpty(haystack)) return false;
    if (haystack === needle) return haystack;
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

const superTrim = string => {
    return string.replace(/^\s+|\s+$/g, "");
};

const isEmpty = obj => {
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
            reject({ status: this.status, statusText: xhr.statusText });
        };
        xhr.onerror = () => {
            reject({ status: this.status, statusText: xhr.statusText });
        };
        xhr.send();
    }).catch(err => {
        console.log(err);
    });
};

const fetchSafeLegacy = ({ url, optionsObj, type }) => {
    // used for sanitizing legacy fetches (takes type: [(JSON) | HTML])
    return new Promise((resolve, reject) => {
        return xhrRequestLegacy(url, !isEmpty(optionsObj) ? optionsObj : {}).then(res => {
            if ((res && !type) || type == "JSON") resolve(safeJSON(JSON.parse(res)));
            else if (res && type == "HTML") resolve(sanitizeToFragment(res));
            else reject(res.statusText || res);
        });
    }).catch(err => console.log(err));
};

const xhrRequest = (url, optionsObj) => {
    // newer fetch() based promisified XHR helper
    let _headers = new Headers();
    if (optionsObj && !isEmpty(optionsObj.headers)) {
        for (let [key, val] of Object.entries(optionsObj.headers)) {
            _headers.append(key, val);
        }
    }
    // set some sane defaults
    if (!isEmpty(optionsObj) && !objContains("mode", optionsObj)) optionsObj.mode = "cors";
    if (!isEmpty(optionsObj) && !objContains("cache", optionsObj)) optionsObj.cache = "no-cache";
    if (!isEmpty(optionsObj) && !!objContains("method", optionsObj)) optionsObj.method = "GET";

    return fetch(
        url,
        optionsObj && {
            method: optionsObj.method,
            mode: optionsObj.mode,
            cache: optionsObj.cache,
            credentials: optionsObj.credentials,
            headers: _headers,
            redirect: optionsObj.redirect,
            referrer: optionsObj.referrer,
            referrerPolicy: optionsObj.referrerPolicy,
            body: optionsObj.body
        }
    );
};

const fetchSafe = (url, fetchOpts, modeObj) => {
    // used for sanitizing fetches
    // fetchOpts gets destructured in 'xhrRequest()'
    // modeObj gets destructured into override bools:
    //   instgrmBool: for embedded instagram graphQL parsing
    //   htmlBool: to force parsing as HTML fragment
    //   rssBool: to force parsing RSS to a sanitized JSON object
    // NOTE: HTML type gets sanitized to a document fragment

    let { instgrmBool, htmlBool, rssBool } = modeObj || {};
    return new Promise((resolve, reject) => {
        xhrRequest(url, !isEmpty(fetchOpts) ? fetchOpts : {})
            .then(res => {
                if (res && res.ok) return res.text();
                return reject("Fetch failed!");
            })
            .then(text => {
                try {
                    if (instgrmBool) {
                        // special case for instagram graphql parsing
                        let metaMatch = /[\s\s]*?"og:description"\scontent="(?:(.*?) - )?[\s\S]+"/im.exec(text);
                        let instgrmGQL = /\:\{"PostPage":\[\{"graphql":([\s\S]+)\}\]\}/im.exec(text);
                        if (instgrmGQL) {
                            return resolve(
                                safeJSON({
                                    metaViews: metaMatch && metaMatch[1],
                                    gqlData: instgrmGQL && JSON.parse(instgrmGQL[1])
                                })
                            );
                        }
                        return reject();
                    } else {
                        let unsafeJSON = JSON.parse(text);
                        return resolve(safeJSON(unsafeJSON));
                    }
                } catch {
                    if (rssBool && text)
                        return parseShackRSS(text)
                            .then(resolve)
                            .catch(reject);
                    if (htmlBool && text) return resolve(DOMPurify.sanitize(text));
                    // caution!
                    else if (isHTML(text)) return resolve(sanitizeToFragment(text)); // auto-detect HTML
                    return reject("Parse failed!");
                }
            });
    }).catch(err => console.log(err));
};

const postXHR = ({ url, data, header, method, override }) => {
    // used for sanitizing POSTs that return JSON
    return new Promise((resolve, reject) => {
        xhrRequest(url, {
            method: method || "POST",
            headers: header,
            body: data
        })
            .then(res => {
                if (res && res.ok) return res.text();
                reject(false);
            })
            .then(text => {
                try {
                    let { chattypics } = override || {};
                    if (chattypics) {
                        let _resFragment = sanitizeToFragment(text);
                        let _resElemArr = _resFragment.querySelector("#allLinksDirect");
                        let _resElemVal = _resFragment.querySelector("#link11");
                        // return a list of links if applicable
                        if (_resElemArr || _resElemVal)
                            resolve(
                                _resElemArr
                                    ? _resElemArr.value.split("\n").filter(x => x !== "")
                                    : _resElemVal && [_resElemVal.value]
                            );
                        reject(false);
                    } else {
                        let _data = JSON.parse(text);
                        resolve(safeJSON(_data));
                    }
                } catch {
                    resolve(true); // be safe here
                }
            });
    }).catch(err => console.log(err));
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

const generatePreview = postText => {
    // simple replacements
    //postText = postText.replace(/&/g, "&amp;"); // breaks Astral encoding
    postText = postText.replace(/</g, "&lt;");
    postText = postText.replace(/>/g, "&gt;");
    postText = postText.replace(/\r\n/g, "<br>");
    postText = postText.replace(/\n/g, "<br>");
    postText = postText.replace(/\r/g, "<br>");

    let complexReplacements = {
        red: { from: ["r{", "}r"], to: ['<span class="jt_red">', "</span>"] },
        green: { from: ["g{", "}g"], to: ['<span class="jt_green">', "</span>"] },
        blue: { from: ["b{", "}b"], to: ['<span class="jt_blue">', "</span>"] },
        yellow: { from: ["y{", "}y"], to: ['<span class="jt_yellow">', "</span>"] },
        olive: { from: ["e\\[", "\\]e"], to: ['<span class="jt_olive">', "</span>"] },
        lime: { from: ["l\\[", "\\]l"], to: ['<span class="jt_lime">', "</span>"] },
        orange: { from: ["n\\[", "\\]n"], to: ['<span class="jt_orange">', "</span>"] },
        pink: { from: ["p\\[", "\\]p"], to: ['<span class="jt_pink">', "</span>"] },
        quote: { from: ["q\\[", "\\]q"], to: ['<span class="jt_quote">', "</span>"] },
        sample: { from: ["s\\[", "\\]s"], to: ['<span class="jt_sample">', "</span>"] },
        strike: { from: ["-\\[", "\\]-"], to: ['<span class="jt_strike">', "</span>"] },
        italic1: { from: ["i\\[", "\\]i"], to: ["<i>", "</i>"] },
        italic2: { from: ["\\/\\[", "\\]\\/"], to: ["<i>", "</i>"] },
        bold1: { from: ["b\\[", "\\]b"], to: ["<b>", "</b>"] },
        bold2: { from: ["\\*\\[", "\\]\\*"], to: ["<b>", "</b>"] },
        underline: { from: ["_\\[", "\\]_"], to: ["<u>", "</u>"] },
        spoiler: {
            from: ["o\\[", "\\]o"],
            to: ['<span class="jt_spoiler" onclick="return doSpoiler(event);">', "</span>"]
        },
        code: { from: ["\\/{{", "}}\\/"], to: ['<pre class="jt_code">', "</pre>"] }
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
}

function scrollToElement(elem, toFitBool) {
    // don't use an arrow function here (for injection purposes)
    if (typeof jQuery === "function" && elem instanceof jQuery) {
        elem = elem[0];
    }
    if (toFitBool) $("html, body").animate({ scrollTop: $(elem).offset().top - 54 }, 0);
    else $("html, body").animate({ scrollTop: $(elem).offset().top - $(window).height() / 4 }, 0);
}

function elementIsVisible(elem, partialBool) {
    // don't use an arrow function here (for injection purposes)
    // only check to ensure vertical visibility
    if (typeof jQuery === "function" && elem instanceof jQuery) {
        elem = elem[0];
    }
    let rect = elem.getBoundingClientRect();
    let visibleHeight = window.innerHeight;
    if (partialBool) return rect.top <= visibleHeight && rect.top + rect.height >= 0;

    return rect.top >= 0 && rect.top + rect.height <= visibleHeight;
}

const elementFitsViewport = elem => {
    if (typeof jQuery === "function" && elem instanceof jQuery) elem = elem[0];
    let elemHeight = elem.getBoundingClientRect().height;
    let visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight;
};

const convertUrlToLink = text => {
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target="_blank">$1</a>');
};

const removeChildren = elem => {
    // https://stackoverflow.com/a/42658543
    while (elem.hasChildNodes()) elem.removeChild(elem.lastChild);
};

const sanitizeToFragment = html => {
    return DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true, RETURN_DOM_IMPORT: true });
};

const safeInnerHTML = (text, targetNode) => {
    let sanitizedContent = sanitizeToFragment(text);
    let targetRange = document.createRange();
    targetRange.selectNodeContents(targetNode);
    targetRange.deleteContents();
    // replace innerHTML assign with sanitized insert
    targetRange.insertNode(sanitizedContent);
};

const safeJSON = json => {
    const sanitizeArr = arr => {
        return arr.map(item => {
            return safeJSON(item);
        });
    };
    // deep clean json objects
    let _json = json && Object.assign(json);
    if (_json) {
        Object.keys(_json).forEach(key => {
            let val = _json[key];
            if (val && typeof val === "object" && !Array.isArray(val)) {
                Object.keys(val).forEach(ikey => {
                    if (val[ikey] && typeof val[ikey] === "object") val[ikey] = safeJSON(val[ikey]);
                    else if (val[ikey] && Array.isArray(val[ikey])) val[ikey] = sanitizeArr(val[ikey]);
                });
            } else if (val && Array.isArray(val)) _json[key] = safeJSON(_json[key]);
            else if (val && typeof val === "boolean") _json[key] = _json[key];
            else if (val) _json[key] = DOMPurify.sanitize(_json[key]);
        });
    }
    return _json;
};

const parseShackRSS = rssText => {
    return new Promise((resolve, reject) => {
        let result = { items: [] };
        if (rssText.startsWith('<?xml version="1.0" encoding="utf-8"?>')) {
            let items = rssText.match(/<item>([\s\S]+?)<\/item>/gim);
            for (let i of items || []) {
                let title = i.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/im);
                let link = i.match(/<link>(.+?)<\/link>/im);
                let date = i.match(/<pubDate>(.+?)<\/pubDate>/im);
                let content = i.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/im);
                let medialink = i.match(/<media:thumbnail url="(.+?)".*\/>/);
                result.items.push({
                    title: title && title[1],
                    link: link && link[1],
                    date: date && date[1],
                    content: content && content[1],
                    medialink: medialink && medialink[1]
                });
            }
        }
        // sanitize our resulting response
        if (!isEmpty(result)) return resolve(safeJSON(result));
        return reject();
    });
};

const isHTML = text => {
    // https://stackoverflow.com/a/15458968
    let doc = new DOMParser().parseFromString(text, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
};

const FormDataToJSON = async fd => {
    const FileToObject = async fileData => {
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
        _fd.push({ key: k, filename: v.name, data: _file });
    }
    return JSON.stringify(_fd);
};

const JSONToFormData = jsonStr => {
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
        return new File([ia], filename, { type: mimeString });
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
