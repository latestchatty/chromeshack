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

function getSettings()
{
    // work around chrome bug 161028
    var s = {};
    for (var key in localStorage)
        s[key] = localStorage[key];
    return s;
}

function getSetting(name, default_value)
{
    var value = localStorage[name];
    if (!value)
        return default_value;
    return JSON.parse(value);
}

function deleteSetting(name)
{
    for (var key in localStorage)
    {
        if (key == name) {
            localStorage.splice(key, 1);
        }
    }
}

function migrateSettings(version)
{
    if (version == 1.26)
    {
        var derp = getSetting('lol_ugh_threshhold', false);
        if (derp != false)
        {
            setSetting('lol_ugh_threshold', derp);
            deleteSetting('lol_ugh_threshhold');
        }
    }

    // add 'ugh' tag if not already added
    if (version == 1.25 || version == 1.26)
    {
        var tags = getSetting("lol_tags", false);
        if (tags != false)
        {
            var has_ugh = false;
            for (var i = 0; i < tags.length; i++)
                if (tags[i].name == 'ugh')
                    has_ugh = true;

            if (!has_ugh)
            {
                tags.push({name: "ugh", color: "#0b0"});
                setSetting('lol_tags', tags);
            }
        }
    }

    var current_version = browser.app.getDetails().version;
    if (version != current_version)
    {
        browser.tabs.create({url: "release_notes.html"});
    }

    setSetting("version", current_version);
}

function setSetting(name, value)
{
    localStorage[name] = JSON.stringify(value);
}

function showPageAction(tabId, url)
{
    browser.pageAction.setIcon({ "tabId": tabId, "path": "shack.png" });
    browser.pageAction.show(tabId);
}


function collapseThread(id)
{
    var MAX_LENGTH = 100;

    var collapsed = getSetting("collapsed_threads", []);

    if (collapsed.indexOf(id) < 0)
    {
        collapsed.unshift(id);

        // remove a bunch if it gets too big
        if (collapsed.length > MAX_LENGTH * 1.25)
            collapsed.splice(MAX_LENGTH);

        setSetting("collapsed_threads", collapsed);
    }
}

function unCollapseThread(id)
{
    var collapsed = getSetting("collapsed_threads", []);
    var index = collapsed.indexOf(id);
    if (index >= 0)
    {
        collapsed.splice(index, 1);
        setSetting("collapsed_threads", collapsed);
    }
}

function addContextMenus()
{
    // get rid of any old and busted context menus
    browser.contextMenus.removeAll();

    // add some basic context menus
    browser.contextMenus.create(
    {
        title: "Show comment history",
        contexts: [ 'link' ],
        onclick: showCommentHistoryClick,
        documentUrlPatterns: [ "http://*.shacknews.com/*" ],
        targetUrlPatterns: [ "http://*.shacknews.com/profile/*" ]
    });
}

function startNotifications()
{
    browser.notifications.onClicked.addListener(notificationClicked);
    pollNotifications();
}

function pollNotifications()
{
    try {
        var notificationuid = getSetting("notificationuid");
        //console.log("Notification UID is " + notificationuid);
        if (notificationuid != "" && notificationuid != undefined) {
            //http://notifications.winchatty.com/v2/notifications/waitForNotification
            postFormUrl("http://notifications.winchatty.com/v2/notifications/waitForNotification", "clientId=" + notificationuid,
                function (res) {
                    try {
                        if(res && res.responseText.length > 0 && res.status === 200) {
                            var notifications = JSON.parse(res.responseText);
                            if(!notifications.error) {
                                //console.log("notification response text: " + res.responseText);
                                if (notifications.messages) {
                                    for (var i = 0; i < notifications.messages.length; i++) {
                                        var n = notifications.messages[i];
                                        browser.notifications.create("ChromeshackNotification" + n.postId.toString(), {
                                               type: "basic",
                                               title: n.subject,
                                               message: n.body,
                                               iconUrl: "icon.png"
                                           },
                                           function (nId) {
                                               //console.log("Created notification id " + nId);
                                           });
                                    }
                                }
                                //If everything was successful, poll again in 15 seconds.
                                setTimeout(pollNotifications, 15000);
                                return;
                            } else {
                                if(notifications.code === 'ERR_UNKNOWN_CLIENT_ID') {
                                    browser.notifications.create("ErrorChromeshackNotification" , {
                                        type: "basic",
                                        title: "ChromeShack Error",
                                        message: "Notifications are no longer enabled for this client, please try enabling them again.",
                                        iconUrl: "icon.png"
                                    },
                                    function (nId) {});
                                    setSetting('notificationuid', '');
                                    setSetting('notifications', false);
                                    return;
                                } else if (notifications.code == 'ERR_CLIENT_NOT_ASSOCIATED') {
                                    browser.tabs.query({url: 'https://winchatty.com/v2/notifications/ui/login*'},
                                       function(tabs){
                                          // If they're not already logging in somewhere, they need to.  Otherwise we'll just leave it alone instead of bringing it to the front or anything annoying like that.
                                          if(tabs.length === 0) {
                                            browser.tabs.create({url: "https://winchatty.com/v2/notifications/ui/login?clientId=" + notificationuid});
                                          }
                                       });
                                }
                            }
                        }
                    } catch (e) {}

                    //If something went wrong, wait a minute before trying again.
                    setTimeout(pollNotifications, 60000);
                }
            );
        }
        else {
            //console.log("Notifications not set up.");
        }
    }
    catch (e) {
        setTimeout(pollNotifications, 60000);
    }
}

function notificationClicked(notificationId) {
    if(notificationId.indexOf("ChromeshackNotification") > -1) {
        var postId = notificationId.replace("ChromeshackNotification", "");
        var url = "https://www.shacknews.com/chatty?id=" + postId + "#item_" + postId;
        browser.tabs.create({url: url});
        browser.notifications.clear(notificationId, function () {});
    }
}

function showCommentHistoryClick(info, tab)
{
    var match = /\/profile\/(.+)$/.exec(info.linkUrl);
    if (match)
    {
        var search_url = "http://winchatty.com/search?author=" + escape(match[1]);
        browser.tabs.create({windowId: tab.windowId, index: tab.index + 1, url: search_url});
    }
}


var allowedIncognito = false;
//Cache this because it has to be run in the context of the extension.
browser.extension.isAllowedIncognitoAccess(function (allowed){
    allowedIncognito = allowed;
});

var lastOpenedIncognito = -1;

function openIncognito(newUrl)
{
    browser.windows.getAll({}, function(windowInfo) {
        var incognitoId = -1;
        if(windowInfo != null)
        {
            for(var i = 0; i<windowInfo.length; i++)
            {
                var w = windowInfo[i];
                if(w.incognito)
                {

                    incognitoId = w.id;
                    if(incognitoId === lastOpenedIncognito)
                    {
                        //If we found the last id we opened with, use that.
                        break;
                    }
                }
            }
        }

        if(incognitoId >= 0)
        {
            browser.tabs.create({url:newUrl, windowId: incognitoId, active: false});
            lastOpenedIncognito = incognitoId; //In case it wasn't opened by us.
        }
        else
        {
    //Since we can't enumerate incognito windows, the best we can do is launch a new window for each one I guess.
            browser.windows.create({url:newUrl, incognito:true, type: 'normal'}, function(windowInfo){
                console.log('Window Id: ' + windowInfo.id);
                lastOpenedIncognito = windowInfo.id;
            });
        }
    });
}

browser.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if (request.name == "getSettings")
    {
        var tab = sender.tab;
        if (tab)
            showPageAction(tab.id, tab.url);
        sendResponse(getSettings());
    }
    else if (request.name == "setSetting")
        setSetting(request.key, request.value);
    else if (request.name == "collapseThread")
        collapseThread(request.id);
    else if (request.name == "unCollapseThread")
        unCollapseThread(request.id);
    else if (request.name === "launchIncognito")
    {
        openIncognito(request.value);
        sendResponse();
    }
    else if (request.name === 'allowedIncognitoAccess')
        sendResponse(allowedIncognito);
    else
        sendResponse();
});

addContextMenus();

// attempt to update version settings
var last_version = getSetting("version", 0);
migrateSettings(last_version);

startNotifications();