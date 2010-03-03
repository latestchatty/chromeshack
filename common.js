function getDescendentByTagAndClassName(parent, tag, class) 
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++) 
    {
        if (descendents[i].className.indexOf(class) == 0) 
            return descendents[i];
    }
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
        v = JSON.parse(v);
    return v;
}
