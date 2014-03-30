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
function getUrl(url, callback)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState == 4)
        {
            callback(xhr);
        }
    }
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
    xhr.setRequestHeader("Content-length", data.length);
    xhr.setRequestHeader("Connection", "close");
    xhr.send(data);
}