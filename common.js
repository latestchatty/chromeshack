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

Array.prototype.contains = function(obj)
{
    var i = this.length;
    while (i--)
    {
        if (this[i] == obj)
            return true;
    }
    return false;
}

String.prototype.trim = function()
{
    return this.replace(/^\s+|\s+$/g,"");
}

Object.prototype.isEmpty = function()
{
    if (this == null) return true;

    for (var key in this) {
        if (this.hasOwnProperty(key))
            return false;
    }
    return true;
}

function xhrRequestLegacy(url, optionsObj) {
    // promisified legacy XHR helper using XMLHttpRequest()
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open(!optionObj.isEmpty() ? optionsObj.method : "GET", url);
        if (optionsObj && optionsObj.headers && !optionsObj.headers.isEmpty()) {
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
        return xhrRequestLegacy(url, optionsObj && !optionsObj.isEmpty() ? optionsObj : {})
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
    if (optionsObj && optionsObj.headers && !optionsObj.headers.isEmpty()) {
        for (var [key, val] of Object.entries(optionsObj.headers)) {
            _headers.append(key, val);
        }
    }
    // set some sane defaults
    if (!optionsObj.isEmpty() && !optionsObj.hasOwnProperty("mode"))
        optionsObj.mode = "cors"
    if (!optionsObj.isEmpty() && !optionsObj.hasOwnProperty("cache"))
        optionsObj.cache = "no-cache"
    if (!optionsObj.isEmpty() && !optionsObj.hasOwnProperty("method"))
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

function fetchSafe(url, optionsObj) {
    // used for sanitizing some fetches (tries to auto-detect)
    // NOTE: HTML type gets sanitized to a document fragment
    return new Promise((resolve, reject) => {
        xhrRequest(url, optionsObj && !optionsObj.isEmpty() ? optionsObj : {})
        .then(res => {
            if (res && res.ok)
                return res.text();
            reject(false);
        })
        .then(text => {
            try {
                var unsafeJSON = JSON.parse(text);
                resolve(safeJSON(unsafeJSON));
            } catch {
                if (isHTML(text))
                    resolve(sanitizeToFragment(text));
                else
                    resolve(true); // be safe here
            }
        });
    }).catch(err => console.log(err));
}

function postXHR({ url, data, header, method }) {
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
                var _data = JSON.parse(text);
                resolve(safeJSON(_data));
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
        var cookie = cookies[i].trim().split('=');
        if (cookie[0] == name)
        {
            ret = cookie[1];
            break;
        }
    }
    return ret;
}

function removeUtf16SurrogatePairs(str) {
    // shacknews doesn't support these and will remove them without counting them towards the post preview limit
    // https://stackoverflow.com/a/22664154
    return str.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '');
}

function generatePreview(text) {
    var preview = removeUtf16SurrogatePairs(text);

    // simple replacements
    preview = preview.replace(/&/g, "&amp;");
    preview = preview.replace(/</g, "&lt;");
    preview = preview.replace(/>/g, "&gt;");
    preview = preview.replace(/\r\n/g, "<br>");
    preview = preview.replace(/\n/g, "<br>");
    preview = preview.replace(/\r/g, "<br>");

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
    for(var ix in complexReplacements) {
        if(complexReplacements.hasOwnProperty(ix)) {
            var rgx = new RegExp(complexReplacements[ix].from[0] + '(.*?)' + complexReplacements[ix].from[1], 'g');
            while(preview.match(rgx) !== null) {
                preview = preview.replace(rgx, complexReplacements[ix].to[0] + '$1' + complexReplacements[ix].to[1]);
            }
        }
    }

    // replace orphaned opening shacktags, close them at the end of the post.
    // this still has (at least) one bug, the shack code does care about nested tag order:
    // b[g{bold and green}g]b <-- correct
    // b[g{bold and green]b}g <-- }g is not parsed by the shack code
    for(var ix in complexReplacements) {
        if(complexReplacements.hasOwnProperty(ix)) {
            var rgx = new RegExp(complexReplacements[ix].from[0], 'g');
            while(preview.match(rgx) !== null) {
                preview = preview.replace(rgx, complexReplacements[ix].to[0]);
                preview = preview + complexReplacements[ix].to[1];
            }
        }
    }

    return convertUrlToLink(preview);
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

HTMLElement.prototype.removeChildren = function()
{
    // https://stackoverflow.com/a/42658543
    while (this.hasChildNodes()) this.removeChild(this.lastChild);
}

function closestParent(elem, { cssSelector, indexSelector }) {
    if (typeof jQuery === "function" && elem instanceof jQuery) { elem = elem[0]; }
    if (!!elem.parentNode && !!elem.parentNode.attributes) {
        // search backwards in the DOM for the closest parent whose attributes match a selector
        for(; elem && elem !== document; elem = elem.parentNode) {
            for (var attrChild of Array.from(elem.attributes || {})) {
                if (indexSelector && !!elem && attrChild.nodeValue.indexOf(indexSelector) > -1)
                    return elem;
                else if (cssSelector && !!elem) {
                    // slower css regex selector method (can match the elem as well)
                    var match = elem.querySelector(`:scope ${cssSelector}`);
                    if (!!match) return match;
                }
            }
        }
    } else if (!!elem.attributes) {
        // this is a top level node, check it anyway
        for (var attrChild of Array.from(elem.attributes)) {
            if (indexSelector && !!elem && attrChild.nodeValue.indexOf(indexSelector) > -1)
                return elem;
            else if (cssSelector && !!elem) {
                // slower css regex selector method (can match the elem as well)
                var match = elem.querySelector(`:scope ${cssSelector}`);
                if (!!match) return match;
            }
        }
    }
}

function stringToUtf8ByteArray(text) {
    var utf8 = unescape(encodeURIComponent(text));
    var textArr = [];
    for (var i = 0; i < utf8.length; i++) {
        textArr.push(utf8.charCodeAt(i));
    }
    return textArr;
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
