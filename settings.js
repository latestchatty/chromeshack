//content-script accessible copy of localStorage
var settings;
var isFirefoxAndroid = false;

// utility function to get a setting out of the local storage snapshot
function getSetting(name)
{
    var v = settings[name];
    if (v)
        return JSON.parse(v);
    return DefaultSettings[name];
}

function reloadSettings(raiseEvent) {
    if (isFirefoxAndroid) {
        browser.storage.local.get("settings")
            .then(
                function success(result) {
                    settings = result.settings || {};
                    if (raiseEvent) {
                        settingsLoadedEvent.raise();
                    }
                },
                function error(e) {
                    settings = {};
                    if (raiseEvent) {
                        settingsLoadedEvent.raise();
                    }
                });
    } else {
        browser.runtime.sendMessage({name: "getSettings"}).then(function(response)
        {
            settings = response;
            if (raiseEvent) {
                settingsLoadedEvent.raise();
            }
        });
    }
}

function setSetting(name, value) {
    if (isFirefoxAndroid) {
        browser.storage.local.set({ settings });
    } else {
        browser.runtime.sendMessage({name: "setSetting", key: name, value: value});
    }
}

reloadSettings(true);
