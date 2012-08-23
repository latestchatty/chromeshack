//content-script accessible copy of localStorage
var settings;

// utility function to get a setting out of the local storage snapshot
function getSetting(name)
{
    var v = settings[name];
    if (v)
        return JSON.parse(v);
    return DefaultSettings[name];
}

chrome.extension.sendMessage({name: "getSettings"}, function(response)
{
    settings = response;
    settingsLoadedEvent.raise();
});

function setSetting(name, value)
{
    chrome.extension.sendMessage({name: "setSetting", key: name, value: value});
}
