function getDescendentByTagAndClassName(parent, tag, class_name)
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++)
    {
        if (descendents[i].className.indexOf(class_name) == 0)
            return descendents[i];
    }
}

function getDescendentByTagAndAnyClassName(parent, tag, class_name)
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++)
    {
        if (descendents[i].className.indexOf(class_name) !== -1)
            return descendents[i];
    }
}

function getDescendentsByTagAndClassName(parent, tag, class_name)
{
    var descendents = parent.getElementsByTagName(tag);
    var descArray = new Array();
    for (var i = 0; i < descendents.length; i++)
    {
        if (descendents[i].className.indexOf(class_name) == 0)
            descArray.push(descendents[i]);
    }

    return descArray;
}

function getDescendentsByTagAndAnyClassName(parent, tag, class_name)
{
    var descendents = parent.getElementsByTagName(tag);
    var descArray = new Array();
    for (var i = 0; i < descendents.length; i++)
    {
        if (descendents[i].className.indexOf(class_name) !== -1)
            descArray.push(descendents[i]);
    }

    return descArray;
}

function stripHtml(html)
{
    return String(html).replace(/(<([^>]+)>)/ig, '');
}

function insertStyle(css, containerName)
{
    var style = document.getElementById(containerName) || document.createElement("style");
    if (!style.id) {
        style.type = "text/css";
        style.id = containerName;
    }
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName("head")[0].appendChild(style);
}

function objContains(needle, haystack)
{
    var i = haystack.length;
    while (i--)
    {
        if (haystack[i] == needle)
            return true;
    }
    return false;
}

function superTrim(string) {
    return string.replace(/^\s+|\s+$/g,"");
}

function isEmpty(obj)
{
    if (!(obj instanceof Object)) return true;
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function xhrRequestLegacy(url, optionsObj) {
    // promisified legacy XHR helper using XMLHttpRequest()
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open(!isEmpty(optionsObj) ? optionsObj.method : "GET", url);
        if (!isEmpty(optionsObj) && optionsObj.headers) {
            for (var [key, val] of Object.entries(optionsObj.headers)) {
                xhr.setRequestHeader(key, val);
            }
        }
        xhr.onload = () => {
            if (this.status >= 200 && this.status < 300 ||
                xhr.statusText.toUpperCase().indexOf("OK") > -1) {
                resolve(xhr.response);
            }
            reject({ status: this.status, statusText: xhr.statusText });
        };
        xhr.onerror = () => { reject({ status: this.status, statusText: xhr.statusText }); };
        xhr.send();
    }).catch(err => { console.log(err); });
}

function fetchSafeLegacy({ url, optionsObj, type }) {
    // used for sanitizing legacy fetches (takes type: [(JSON) | HTML])
    return new Promise((resolve, reject) => {
        return xhrRequestLegacy(url, !isEmpty(optionsObj) ? optionsObj : {})
            .then(res => {
                if (res && !type || type == "JSON")
                    resolve(safeJSON(JSON.parse(res)));
                else if (res && type == "HTML")
                    resolve(sanitizeToFragment(res));
                else
                    reject(res.statusText || res);
            });
    }).catch(err => console.log(err));
}

function xhrRequest(url, optionsObj) {
    // newer fetch() based promisified XHR helper
    var _headers = new Headers();
    if (optionsObj && !isEmpty(optionsObj.headers)) {
        for (var [key, val] of Object.entries(optionsObj.headers)) {
            _headers.append(key, val);
        }
    }
    // set some sane defaults
    if (!isEmpty(optionsObj) && !optionsObj.hasOwnProperty("mode"))
        optionsObj.mode = "cors"
    if (!isEmpty(optionsObj) && !optionsObj.hasOwnProperty("cache"))
        optionsObj.cache = "no-cache"
    if (!isEmpty(optionsObj) && !optionsObj.hasOwnProperty("method"))
        optionsObj.method = "GET"

    return fetch(url, optionsObj && {
        method: optionsObj.method,
        mode: optionsObj.mode,
        cache: optionsObj.cache,
        credentials: optionsObj.credentials,
        headers: _headers,
        redirect: optionsObj.redirect,
        referrer: optionsObj.referrer,
        referrerPolicy: optionsObj.referrerPolicy,
        body: optionsObj.body
    });
}

function fetchSafe(url, optionsObj, modeObj) {
    // used for sanitizing some fetches (tries to auto-detect)
    // NOTE: HTML type gets sanitized to a document fragment
    let { instgrmBool, htmlBool } = modeObj || {};
    return new Promise((resolve, reject) => {
        xhrRequest(url, !isEmpty(optionsObj) ? optionsObj : {})
        .then(res => {
            if (res && res.ok)
                return res.text();
            reject(false);
        })
        .then(text => {
            try {
                if (instgrmBool) {
                    // special case for instagram graphql parsing
                    let metaMatch = /[\s\s]*?"og:description"\scontent="(?:(.*?) - )?[\s\S]+"/im.exec(text);
                    let instgrmGQL = /\:\{"PostPage":\[\{"graphql":([\s\S]+)\}\]\}/im.exec(text);
                    if (instgrmGQL) {
                        resolve(safeJSON({
                            metaViews: metaMatch && metaMatch[1],
                            gqlData: instgrmGQL && JSON.parse(instgrmGQL[1])
                        }));
                    }
                    reject(false);
                }
                else {
                    let unsafeJSON = JSON.parse(text);
                    resolve(safeJSON(unsafeJSON));
                }
            } catch {
                if (htmlBool && text)
                    resolve(DOMPurify.sanitize(text)); // caution!
                else if (isHTML(text))
                    resolve(sanitizeToFragment(text));
                reject(false); // reject for safety if parse fails
            }
        });
    }).catch(err => console.log(err));
}

function postXHR({ url, data, header, method, override }) {
    // used for sanitizing POSTs that return JSON
    return new Promise((resolve, reject) => {
        xhrRequest(url, {
            method: method || "POST",
            headers: header,
            body: data
        }).then(res => {
            if (res && res.ok)
                return res.text()
            reject(false);
        }).then(text => {
            try {
                let { chattypics } = override || {};
                if (chattypics) {
                    let _resFragment = sanitizeToFragment(text);
                    let _resElemArr = _resFragment.querySelector("#allLinksDirect");
                    let _resElemVal = _resFragment.querySelector("#link11");
                    // return a list of links if applicable
                    if (_resElemArr || _resElemVal)
                        resolve(_resElemArr ?
                            _resElemArr.value.split("\n").filter(x => x !== "") :
                            (_resElemVal && [ _resElemVal.value ])
                        );
                    reject(false);
                } else {
                    var _data = JSON.parse(text);
                    resolve(safeJSON(_data));
                }
            } catch {
                resolve(true); // be safe here
            }
        });
    }).catch(err => console.log(err));
}

function getCookieValue(name, defaultValue)
{
    var ret = defaultValue | '';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++)
    {
        var cookie = superTrim(cookies[i]).split('=');
        if (cookie[0] == name)
        {
            ret = cookie[1];
            break;
        }
    }
    return ret;
}

function generatePreview(postText) {
    // simple replacements
    //postText = postText.replace(/&/g, "&amp;"); // breaks Astral encoding
    postText = postText.replace(/</g, "&lt;");
    postText = postText.replace(/>/g, "&gt;");
    postText = postText.replace(/\r\n/g, "<br>");
    postText = postText.replace(/\n/g, "<br>");
    postText = postText.replace(/\r/g, "<br>");

    var complexReplacements = {
        'red': {'from': ['r{','}r'], 'to': ['<span class="jt_red">','</span>']},
        'green': {'from': ['g{','}g'], 'to': ['<span class="jt_green">','</span>']},
        'blue': {'from': ['b{','}b'], 'to': ['<span class="jt_blue">','</span>']},
        'yellow': {'from': ['y{','}y'], 'to': ['<span class="jt_yellow">','</span>']},
        'olive': {'from': ['e\\[','\\]e'], 'to': ['<span class="jt_olive">','</span>']},
        'lime': {'from': ['l\\[','\\]l'], 'to': ['<span class="jt_lime">','</span>']},
        'orange': {'from': ['n\\[','\\]n'], 'to': ['<span class="jt_orange">','</span>']},
        'pink': {'from': ['p\\[','\\]p'], 'to': ['<span class="jt_pink">','</span>']},
        'quote': {'from': ['q\\[','\\]q'], 'to': ['<span class="jt_quote">','</span>']},
        'sample': {'from': ['s\\[','\\]s'], 'to': ['<span class="jt_sample">','</span>']},
        'strike': {'from': ['-\\[','\\]-'], 'to': ['<span class="jt_strike">','</span>']},
        'italic1': {'from': ['i\\[','\\]i'], 'to': ['<i>','</i>']},
        'italic2': {'from': ['\\/\\[','\\]\\/'], 'to': ['<i>','</i>']},
        'bold1': {'from': ['b\\[','\\]b'], 'to': ['<b>','</b>']},
        'bold2': {'from': ['\\*\\[','\\]\\*'], 'to': ['<b>','</b>']},
        'underline': {'from': ['_\\[','\\]_'], 'to': ['<u>','</u>']},
        'spoiler': {'from': ['o\\[','\\]o'], 'to': ['<span class="jt_spoiler" onclick="return doSpoiler(event);">','</span>']},
        'code': {'from': ['\\/{{','}}\\/'], 'to': ['<pre class="jt_code">','</pre>']}
    };

    // replace matching pairs first
    for (var ix in complexReplacements) {
        if (complexReplacements.hasOwnProperty(ix)) {
            var rgx = new RegExp(complexReplacements[ix].from[0] + '(.*?)' + complexReplacements[ix].from[1], 'g');
            while (postText.match(rgx) !== null) {
                postText = postText.replace(rgx, complexReplacements[ix].to[0] + '$1' + complexReplacements[ix].to[1]);
            }
        }
    }

    // replace orphaned opening shacktags, close them at the end of the post.
    // this still has (at least) one bug, the shack code does care about nested tag order:
    // b[g{bold and green}g]b <-- correct
    // b[g{bold and green]b}g <-- }g is not parsed by the shack code
    for (var ix in complexReplacements) {
        if (complexReplacements.hasOwnProperty(ix)) {
            var rgx = new RegExp(complexReplacements[ix].from[0], 'g');
            while (postText.match(rgx) !== null) {
                postText = postText.replace(rgx, complexReplacements[ix].to[0]);
                postText = postText + complexReplacements[ix].to[1];
            }
        }
    }
    return convertUrlToLink(postText);
}

function debounce(cb, delay)
{
    // even simpler debounce to prevent bugginess
    var _debounce;
    return function() {
        const _cxt = this;
        const _args = arguments;
        clearTimeout(_debounce);
        _debounce = setTimeout(function() {
            cb.apply(_cxt, _args);
        }, delay);
    };
}

function scrollToElement(elem, toFitBool) {
    if (typeof jQuery === "function" && elem instanceof jQuery) { elem = elem[0]; }
    if (toFitBool)
        $('html, body').animate({ scrollTop: $(elem).offset().top - 54 }, 0);
    else
        $('html, body').animate({ scrollTop: $(elem).offset().top - ($(window).height()/4) }, 0);
}

function elementIsVisible(elem, partialBool) {
    // only check to ensure vertical visibility
    if (typeof jQuery === "function" && elem instanceof jQuery) { elem = elem[0]; }
    var rect = elem.getBoundingClientRect();
    var visibleHeight = window.innerHeight;
    if (partialBool)
        return rect.top <= visibleHeight && (rect.top + rect.height) >= 0;

    return rect.top >= 0 && (rect.top + rect.height) <= visibleHeight;
}

function elementFitsViewport(elem) {
    if (typeof jQuery === "function" && elem instanceof jQuery) { elem = elem[0]; }
    var elemHeight = elem.getBoundingClientRect().height;
    var visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight;
}

function convertUrlToLink(text)
{
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target=\"_blank\">$1</a>');
}

function removeChildren(elem)
{// https://stackoverflow.com/a/42658543
    while (elem.hasChildNodes()) elem.removeChild(elem.lastChild);
}

function sanitizeToFragment(html) {
    return DOMPurify.sanitize(html, {RETURN_DOM_FRAGMENT: true, RETURN_DOM_IMPORT: true});
}

function safeInnerHTML(text, targetNode) {
    var sanitizedContent = sanitizeToFragment(text);
    var targetRange = document.createRange();
    targetRange.selectNodeContents(targetNode);
    targetRange.deleteContents();
    // replace innerHTML assign with sanitized insert
    targetRange.insertNode(sanitizedContent);
}

function safeJSON(json) {
    // deep clean json objects
    var _json = json && Object.assign(json);
    if (_json) {
        Object.keys(_json).forEach(key => {
            let val = _json[key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                Object.keys(val).forEach(ikey => {
                    if (val[ikey] && typeof val[ikey] === 'object')
                        val[ikey] = safeJSON(val[ikey]);
                    else if (val[ikey] && Array.isArray(val[ikey]))
                        val[ikey] = sanitizeArr(val[ikey]);
                });
            }
            else if (val && Array.isArray(val))
                _json[key] = safeJSON(_json[key]);
            else if (val && typeof val === 'boolean')
                _json[key] = _json[key];
            else if (val)
                _json[key] = DOMPurify.sanitize(_json[key]);
        });
    }
    return _json;

    function sanitizeArr(arr) {
        return arr.map(item => {
            return safeJSON(item);
        });
    }
}

function isHTML(text) {
    // https://stackoverflow.com/a/15458968
    var doc = new DOMParser().parseFromString(text, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
}

async function FormDataToJSON(fd) {
    let _fd = [];
    for (let [k, v] of fd) {
        let _file = await FileToObject(v);
        _fd.push({ key: k, filename: v.name, data: _file });
    }
    return JSON.stringify(_fd);

    /* support func */
    async function FileToObject(fileData) {
        const reader = new FileReader();
        reader.readAsDataURL(fileData);
        return new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    }
}

function JSONToFormData(jsonStr) {
    let _obj = JSON.parse(jsonStr);
    let _fd = new FormData();
    for (let v of Object.values(_obj)) {
        let _file = Base64ToFile(v.filename, v.data);
        _fd.append(v.key, _file);
    }
    if (!_fd.entries().next().done)
        return _fd;
    return null;

    /* support func */
    function Base64ToFile(filename, baseStr) {
        // https://stackoverflow.com/a/5100158
        let byteString;
        if (baseStr.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(baseStr.split(',')[1]);
        else
            byteString = unescape(baseStr.split(',')[1]);

        // separate out the mime component
        let mimeString = baseStr.split(',')[0].split(':')[1].split(';')[0];
        // write the bytes of the string to a typed array
        let ia = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new File([ia], filename, { type: mimeString });
    }
}
