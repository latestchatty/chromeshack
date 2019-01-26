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

function insertStyle(css)
{
    var style = document.createElement("style");
    style.type = "text/css";
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

function xhrRequestLegacy(url, optionsObj) {
    // promisified legacy XHR helper using XMLHttpRequest()
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open(optionsObj.method || "GET", url);
        if (optionsObj != null && optionsObj.hasOwnProperty("headers")) {
            for (var [key, val] of optionsObj.headers.entries()) {
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

function xhrRequest(url, optionsObj) {
    // newer fetch() based promisified XHR helper
    var _headers = new Headers();
    if (optionsObj && optionsObj.hasOwnProperty("headers")) {
        for (var [key, val] of optionsObj.headers.entries()) {
            _headers.append(key, val);
        }
    }
    // set some sane defaults
    if (optionsObj && !optionsObj.hasOwnProperty("mode"))
        optionsObj.mode = "cors"
    if (optionsObj && !optionsObj.hasOwnProperty("cache"))
        optionsObj.cache = "no-cache"
    if (optionsObj && !optionsObj.hasOwnProperty("method"))
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

function postXHR(url, data) {
    return new Promise((resolve, reject) => {
        xhrRequest(url, {
            method: "POST",
            headers: new Map().set("Content-type", "application/x-www-form-urlencoded"),
            body: data
        }).then(async res => {
            var response = await res;
            if (response.ok)
                resolve(response);
            else
                reject(res.status);
        })
    }).catch(err => { console.log(err); });
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

    preview = convertUrlToLink(preview);

    return preview;
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

function scrollToElement(elem) {
    $(elem).animate({ scrollTop: $('body').scrollTop() + $(elem).offset().top - $('body').offset().top }, 0);
    $('html, body').animate({ scrollTop: $(elem).offset().top - ($(window).height()/4) }, 0);
}

function elementIsVisible(elem) {
    var elementTop = $(elem).offset().top;
    var elementBottom = elementTop + $(elem).outerHeight();
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
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
