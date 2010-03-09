function getDescendentByTagAndClassName(parent, tag, class) 
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++) 
    {
        if (descendents[i].className.indexOf(class) == 0) 
            return descendents[i];
    }
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

// get a snapshot of the local storage settings
var settings;
chrome.extension.sendRequest({name: "getSettings"}, function(response)
{
    settings = response;
});

// utility function to get a setting out of the local storage snapshot
function getSetting(name)
{
    var v = settings[name];
    if (v)
        return JSON.parse(v);
    return DefaultSettings[name];
}

// utility function to make an XMLHttpRequest
function getUrl(url, callback)
{
    chrome.extension.sendRequest({"name": "getUrl", "url": url}, function(response)
    {
        callback(response);
    });
}

var current_version = 1.2;
