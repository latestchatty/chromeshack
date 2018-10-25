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

// utility function to make an XMLHttpRequest
function getUrl(url, callback, errorCallback)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState == 4) {
            if (xhr.status >= 200 && xhr.status <= 399) {
                callback(xhr);
            } else if (errorCallback) {
                errorCallback();
            }
        }
    };
    xhr.open("GET", url, true);
    xhr.send();
}

function putUrl(url, data, callback)
{
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if(xhr.readyState == 4)
		{
			if(xhr != undefined && xhr != null)
			{
				callback(xhr);
			}
		}
	}
	xhr.open("PUT", url, true);
	xhr.send(data);
}

function postUrl(url, data, callback)
{
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if(xhr.readyState == 4)
		{
			if(xhr != undefined && xhr != null)
			{
				callback(xhr);
			}
		}
	}
	xhr.open("POST", url, true);
	xhr.send(data);
}

function postFormUrl(url, data, callback)
{
    // It's necessary to set the request headers for PHP's $_POST stuff to work properly
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if(xhr.readyState == 4)
        {
            if(xhr != undefined && xhr != null)
            {
                callback(xhr);
            }
        }
    }
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(data);
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

function debounce(cb, timeout, override)
{
    // pretty bog standard debounce to prevent trailing execution (ex: Underscore)
    var _timeout;
    return function() {
        var _ctx = this
        var _arg = arguments;
        // semaphore we use for trail cancelling
        var execImp = override && !_timeout;

        // recursive trailing until 'override' or timeout
        var later = function() {
            _timeout = null;
            if (!override) {
                cb.apply(_ctx, _arg);
            }
        };
        clearTimeout(_timeout);
        _timeout = setTimeout(later, timeout);
        // 'override' will cancel our recursive trail
        if (execImp) {
            cb.apply(_ctx, _arg)
        };
    }
}

function convertUrlToLink(text)
{
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target=\"_blank\">$1</a>');
}

function scrollToElement(elem)
{
    // scroll our element to the center of the screen
    $(elem).animate(
        { scrollTop: $('body').scrollTop() + $(elem).offset().top - $('body').offset().top },
        { duration: 200, easing: 'swing'}
    );
    $('html,body').animate(
        { scrollTop: $(elem).offset().top - ($(window).height()/3) },
        { duration: 200, easing: 'swing'}
    );
}

function elementIsVisible(elem)
{
    // https://stackoverflow.com/a/51001117
    let x = elem.getBoundingClientRect().left;
    let y = elem.getBoundingClientRect().top;
    let ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let hw = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    let w = elem.clientWidth;
    let h = elem.clientHeight;
    return (
        (y < hw &&
            y + h > 0) &&
        (x < ww &&
            x + w > 0)
    );
}

HTMLElement.prototype.appendHTML = function(html)
{
    // https://stackoverflow.com/a/42658543
    var dom = new DOMParser().parseFromString(html, 'text/html').body;
    while (dom.hasChildNodes()) this.appendChild(dom.firstChild);
}

HTMLElement.prototype.replaceHTML = function(html)
{
    // ex: https://stackoverflow.com/a/42658543
    // a slower but somewhat safer alternative to innerHTML
    while (this.hasChildNodes()) this.removeChild(this.lastChild);
    var dom = new DOMParser().parseFromString(html, 'text/html').body;
    while (dom.hasChildNodes()) this.appendChild(dom.firstChild);
}

HTMLElement.prototype.removeChildren = function()
{
    // https://stackoverflow.com/a/42658543
    while (this.hasChildNodes()) this.removeChild(this.lastChild);
}