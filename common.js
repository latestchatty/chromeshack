function getDescendentByTagAndClassName(parent, tag, class_name) 
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++) 
    {
        if (descendents[i].className.indexOf(class_name) == 0) 
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
function getUrl(url, callback)
{
    chrome.extension.sendMessage({"name": "getUrl", "url": url}, function(response)
    {
        callback(response);
    });
}