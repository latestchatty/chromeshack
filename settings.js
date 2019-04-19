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

function reloadSettings(raiseEvent) {
    browser.runtime.sendMessage({name: "getSettings"}).then(function(response)
    {
        settings = response;
        if (raiseEvent) {
            settingsLoadedEvent.raise();
        }
    });
}

function setSetting(name, value)
{
    browser.runtime.sendMessage({name: "setSetting", key: name, value: value});
}

reloadSettings(true);
