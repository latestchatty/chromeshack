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

// more flexible promisified XHR helper
function xhrRequest({ type, url, headers, body }) {
    return new Promise((resolve, reject) => {
        // headers is a Map()
        var xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        if (headers) {
            for (var [key, val] of headers.entries()) {
                xhr.setRequestHeader(key, val);
            }
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.statusText);
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(body);
    })
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

function convertUrlToLink(text)
{
    return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target=\"_blank\">$1</a>');
}

function scrollToElement(elem, duration)
{
    $(elem).animate(
        { scrollTop: $('body').scrollTop() + $(elem).offset().top - $('body').offset().top },
        { duration: duration ? 150 : duration, easing: 'swing'}
    );
    $('html,body').animate(
        { scrollTop: $(elem).offset().top - ($(window).height()/4) },
        { duration: duration ? 150 : duration, easing: 'swing'}
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

function toggleVideoState(video) {
    // abstracted helper for toggling html5 video embed pause state
    try {
        if (video && video.nodeName === "VIDEO") {
            if (video.paused) {
                video.currentTime = 0;
                video.play();
            } else {
                video.pause();
                video.currentTime = 0;
            }
        }
    } catch (err) { console.log(err); }
}

function toggleMediaItem(link, postBodyElem, postId, index) {
    // abstracted helper for toggling media container items from a post
    var _expandoClicked = link.classList !== undefined && link.classList.contains("expando");
    var _embedExists = postBodyElem.querySelector(`#loader_${postId}-${index}`) ||
                        postBodyElem.querySelector(`#instgrm-container_${postId}-${index}`) ||
                        postBodyElem.querySelector(`#tweet-container_${postId}-${index}`);
    var _expando = postBodyElem.querySelector(`#expando_${postId}-${index}`);

    // pretty aggressive way to handle stopping the video player when toggling the container
    var iframeMedia = link.parentNode.querySelector(`#iframe_${postId}-${index}`);
    if (iframeMedia)
        iframeMedia.parentNode.parentNode.removeChild(iframeMedia.parentNode);

    // state toggle our various embed children
    toggleVideoState(_embedExists);
    if (_embedExists && _expando) { toggleExpandoButton(_expando); }
    if (_embedExists && _expandoClicked) {
        link.parentNode.classList.toggle("embedded");
        _embedExists.classList.toggle("hidden");
        return true;
    } else if (_embedExists) {
        link.classList.toggle("embedded");
        _embedExists.classList.toggle("hidden");
        return true;
    }

    return false;
}

function insertCommand(elem, injectable) {
    // insert a one-way script that executes synchronously (caution!)
    var _script = document.createElement("script");
    _script.textContent = `${injectable}`;
    elem.appendChild(_script);
}

function mediaContainerInsert(elem, link, id, index, width) {
    // abstracted helper for manipulating the media-container grid from a post
    var container = link.parentNode.querySelector(".media-container");
    var embed = link.querySelector(`#loader_${id}-${index}`);
    var expando = link.querySelector(`#expando_${id}-${index}`);
    if (!container) {
        // generate container if necessary
        container = document.createElement("div");
        container.setAttribute("class", "media-container");
    }

    // use our width passed from 'video_loader' to mutate this media container for HD video
    if (width != null)
        container.style.gridTemplateColumns = `repeat(auto-fill, minmax(min-content, ${width}px))`;

    ((expando, embed, elem, link) => {
        elem.addEventListener('click', e => {
            // toggle our embed state when image embed is left-clicked
            if (e.which === 1) {
                link.classList.toggle("embedded"); // toggle highlight
                elem.classList.toggle("hidden");
                toggleExpandoButton(expando);
                toggleVideoState(embed);
            }
        });
    })(expando, embed, elem, link);

    container.appendChild(elem);
    link.classList.add("embedded");
    toggleExpandoButton(expando);
    toggleVideoState(embed);
    link.parentNode.appendChild(container);
}

function insertExpandoButton(link, postId, index) {
    // abstracted helper for appending an expando button to a link in a post
    if (link.querySelector("div.expando") != null) { return; }
    // process a link into a link container that includes a dynamic styled "button"
    var expando = document.createElement("div");
    expando.classList.add("expando");
    expando.id = `expando_${postId}-${index}`;
    expando.style.fontFamily = "Icon";
    expando.innerText = "\ue907";
    link.appendChild(expando);
}

function toggleExpandoButton(expando) {
    // abstracted helper for toggling the state of a link-expando button from a post
    if (expando && !expando.classList.contains("collapso")) {
        // override is the expando 'button' element
        expando.innerText = "\ue90d"; // circle-arrow-down
        return expando.classList.add("collapso");
    } else if (expando) {
        expando.innerText = "\ue907"; // circle-arrow-up
        return expando.classList.remove("collapso");
    }
}
