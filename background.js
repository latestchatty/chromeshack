function getSettings()
{
    return localStorage;
}

function getSetting(name, default_value)
{
    var value = localStorage[name];
    if (!value)
        return default_value;
    return JSON.parse(value);
}

function migrateSettings(version)
{
    if (version == "1.7")
    {
        // enable a bunch of new things by default
        scripts = getSetting("enabled_scripts");
        if (scripts.indexOf("winchatty_coments_search") < 0)
            scripts.push("winchatty_comments_search");

        if (scripts.indexOf("video_loader" < 0))
            scripts.push("video_loader");

        // lots of people don't know this is here, just turn it on
        if (scripts.indexOf("collapse_threads") < 0)
            scripts.push("collapse_threads");

        setSetting("enabled_scripts", scripts);
    }
    else if (version == 1.9)
    {
        scripts = getSetting("enabled_scripts");
        if (scripts.indexOf("new_comment_highlighter") < 0)
            scripts.push("new_comment_highlighter");

        setSetting("enabled_scripts", scripts);
    }
    else if (version == 1.14)
    {
        scripts = getSetting("enabled_scripts");
        if (scripts.indexOf("expiration_watcher") < 0)
            scripts.push("expiration_watcher");

        setSetting("enabled_scripts", scripts);
    }
    else if (version == 1.21)
    {
        /*
        Migrate lol_show_counts setting

        If lol_show_counts was false, set value to 'none'
        if lol_show_counts was true, set value to 'limited'

        User will have to manually change setting to 'all'
        to enable that feature
        */
        if (getSetting('lol_show_counts', false) === false)
            setSetting('lol_show_counts', 'none');
        else
            setSetting('lol_show_counts', 'limited');
    }


    if (version != chrome.app.getDetails().version)
    {
        chrome.tabs.create({url: "release_notes.html"});
    }

    setSetting("version", chrome.app.getDetails().version);
}

function setSetting(name, value)
{
    localStorage[name] = JSON.stringify(value);
}

function getUrl(url, callback)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState == 4)
        {
            // Chrome 21 stringifies the data sent to callback?  It seems to be
            //      expecting JSON...
            //      We hit an unhandled exception; the stack trace includes a
            //      chromeHidden.JSON.stringify method.
            //callback(xhr);
            callback(xhr.responseText);
        }
    }
    xhr.open("GET", url, true);
    xhr.send();
}

function showPageAction(tabId, url)
{
    chrome.pageAction.setIcon({ "tabId": tabId, "path": "shack.png" });
    chrome.pageAction.show(tabId);
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
    chrome.contextMenus.removeAll();

    // add some basic context menus
    chrome.contextMenus.create(
    {
        title: "Show comment history",
        contexts: [ 'link' ],
        onclick: showCommentHistoryClick,
        documentUrlPatterns: [ "http://*.shacknews.com/*" ],
        targetUrlPatterns: [ "http://*.shacknews.com/profile/*" ]
    });
}

function showCommentHistoryClick(info, tab)
{
    var match = /\/profile\/(.+)$/.exec(info.linkUrl);
    if (match)
    {
        var search_url = "http://winchatty.com/search?author=" + escape(match[1]);
        chrome.tabs.create({windowId: tab.windowId, index: tab.index + 1, url: search_url});
    }
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse)
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
    else if (request.name == "getUrl")
        getUrl(request.url, sendResponse);
    else if (request.name == "collapseThread")
        collapseThread(request.id);
    else if (request.name == "unCollapseThread")
        unCollapseThread(request.id);
    else
        sendResponse();

    return true;
});

addContextMenus();

// attempt to update version settings
var last_version = getSetting("version", 0);


migrateSettings(last_version);