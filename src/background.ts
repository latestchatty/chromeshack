import { browser, Menus, Tabs, WebRequest } from "webextension-polyfill-ts";

import { fetchSafe, JSONToFormData, FetchArgs } from "./core/common";
import {
    resetSettings,
    getSettingsLegacy,
    getSettings,
    getSetting,
    setSetting,
    getEnabled,
    setEnabled,
    removeEnabled,
} from "./core/settings";

import chatViewFix from "./patches/chatViewFix";
import scrollByKeyFix from "./patches/scrollByKeyFix";

interface Notification {
    error?: object;
    code?: string;
    messages?: [];
}

interface NotificationMessage {
    postId: number;
    subject: string;
    body: string;
}

type OnMessageRequestName =
    | "launchIncognito"
    | "allowedIncognitoAccess"
    | "chatViewFix"
    | "scrollByKeyFix"
    | "corbFetch"
    | "corbPost";
interface OnMessageRequest {
    name: OnMessageRequestName;
    data?: any;
    value?: string;
    url?: string;
    fetchOpts: FetchArgs;
    headers: any;
    parseType: any;
}

const migrateSettings = async () => {
    const legacy_settings = getSettingsLegacy();
    const last_version = await getSetting("version", 0);
    const current_version = parseFloat(browser.runtime.getManifest().version);
    if (legacy_settings && legacy_settings["version"] <= 1.63) {
        // quick reload from default settings of nuStorage
        await resetSettings().then(getSettings);
        // preserve previous convertible filters and notifications state
        const prevFilters = legacy_settings["user_filters"] || null;
        const prevNotifyUID = legacy_settings["notificationuid"] || null;
        const prevNotifyState = legacy_settings["notifications"] || null;
        if (prevFilters) await setSetting("user_filters", prevFilters);
        if (prevNotifyUID && prevNotifyState) {
            await setSetting("notificationuid", prevNotifyUID);
            await setEnabled("enable_notifications");
        }
        window.localStorage.clear();
    }
    if (last_version !== current_version) await browser.tabs.create({ url: "release_notes.html" });
    await setSetting("version", current_version);
};

const showCommentHistoryClick = (info: Menus.OnClickData, tab: Tabs.Tab) => {
    const match = /\/profile\/(.+)$/.exec(info.linkUrl);
    if (match) {
        const search_url = "https://winchatty.com/search?author=" + escape(match[1]);
        browser.tabs.create({
            windowId: tab.windowId,
            index: tab.index + 1,
            url: search_url,
        });
    }
};

const addContextMenus = async () => {
    // get rid of any old and busted context menus
    await browser.contextMenus.removeAll();
    // add some basic context menus
    browser.contextMenus.create({
        title: "Show comment history",
        contexts: ["link"],
        onclick: showCommentHistoryClick,
        documentUrlPatterns: ["https://*.shacknews.com/*"],
        targetUrlPatterns: ["https://*.shacknews.com/profile/*"],
    });
};

const startNotifications = async () => {
    try {
        browser.notifications.onClicked.addListener(notificationClicked);
        await pollNotifications();
    } catch (e) {
        console.error(e);
    }
};

const pollNotifications = async () => {
    try {
        const notificationuid = await getSetting("notificationuid");
        if ((await getEnabled("enable_notifications")) && notificationuid) {
            const _notifications: Notification = await fetchSafe({
                url: "https://winchatty.com/v2/notifications/waitForNotification",
                fetchOpts: {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `clientId=${notificationuid}`,
                },
            });
            if (!_notifications?.error) {
                if (_notifications?.messages) {
                    for (let i = 0; i < _notifications?.messages.length; i++) {
                        const n: NotificationMessage = _notifications.messages[i];
                        await browser.notifications.create("ChromeshackNotification" + n.postId.toString(), {
                            type: "basic",
                            title: n.subject,
                            message: n.body,
                            iconUrl: "images/icon.png",
                        });
                    }
                    //If everything was successful, poll again in 15 seconds.
                    setTimeout(pollNotifications, 15000);
                } else {
                    if (_notifications?.code === "ERR_UNKNOWN_CLIENT_ID") {
                        await browser.notifications.create("ErrorChromeshackNotification", {
                            type: "basic",
                            title: "ChromeShack Error",
                            message:
                                "Notifications are no longer enabled for this client, please try enabling them again.",
                            iconUrl: "images/icon.png",
                        });
                        await setSetting("notificationuid", "");
                        await removeEnabled("enable_notifications");
                    } else if (_notifications?.code == "ERR_CLIENT_NOT_ASSOCIATED") {
                        await browser.tabs
                            .query({ url: "https://winchatty.com/v2/notifications/ui/login*" })
                            .then(async (tabs: Tabs.Tab[]) => {
                                // If they're not already logging in somewhere, they need to.  Otherwise we'll just leave it alone instead of bringing it to the front or anything annoying like that.
                                if (tabs.length === 0) {
                                    await browser.tabs.create({
                                        url: `https://winchatty.com/v2/notifications/ui/login?clientId=${notificationuid}`,
                                    });
                                }
                            });
                    }
                    setTimeout(pollNotifications, 60000);
                }
            }
        } else if (!(await getEnabled("enable_notifications"))) {
            // disable the detached guid
            await setSetting("notificationuid", "");
            await removeEnabled("enable_notifications");
        }
    } catch (e) {
        console.error(e);
        setTimeout(pollNotifications, 60000);
    }
};

const notificationClicked = async (notificationId: string) => {
    if (notificationId.indexOf("ChromeshackNotification") > -1) {
        const postId = notificationId.replace("ChromeshackNotification", "");
        const url = `https://www.shacknews.com/chatty?id=${postId}#item_${postId}`;
        await browser.tabs.create({ url: url });
        await browser.notifications.clear(notificationId);
    }
};

browser.runtime.onMessage.addListener(
    async (request: OnMessageRequest): Promise<any> => {
        try {
            if (request.name === "launchIncognito")
                // necessary for opening nsfw links in an incognito window
                return browser.windows.create({ url: request.value, incognito: true });
            else if (request.name === "allowedIncognitoAccess")
                // necessary for knowing when to open nsfw media in an incognito window
                return browser.extension.isAllowedIncognitoAccess();
            else if (request.name === "chatViewFix") {
                // scroll-to-post fix for Chatty
                return chatViewFix();
            } else if (request.name === "scrollByKeyFix") {
                // scroll-by-key fix for Chatty
                return scrollByKeyFix();
            } else if (request.name === "corbFetch") {
                const fetchArgs: FetchArgs = {
                    url: request.url,
                    fetchOpts: request.fetchOpts,
                    parseType: request.parseType,
                };
                return fetchSafe(fetchArgs);
            } else if (request.name === "corbPost") {
                const _fd = JSONToFormData(request.data);
                const fetchArgs: FetchArgs = {
                    url: request.url,
                    fetchOpts: {
                        method: "POST",
                        headers: request.headers,
                        body: _fd,
                    },
                    parseType: request.parseType,
                };
                return fetchSafe(fetchArgs);
            }
            return true;
        } catch (e) {
            console.error(e);
        }
    },
);

/*
    Workaround for Twitter API's lack of support for cross-domain JSON fetch.
    NOTE: we override only responses from "api.twitter.com" and sanitize the fetch result
        with a fetch() helper in common.js so only non-HTML containing JSON is ever used.
*/
try {
    const responseListener = (details: WebRequest.OnHeadersReceivedDetailsType) => {
        details.responseHeaders.push({
            name: "Access-Control-Allow-Headers",
            value: "*",
        });
        details.responseHeaders.push({
            name: "Access-Control-Allow-Methods",
            value: "GET",
        });
        return { responseHeaders: details.responseHeaders };
    };
    browser.webRequest.onHeadersReceived.removeListener(responseListener);
    browser.webRequest.onHeadersReceived.addListener(responseListener, { urls: ["https://api.twitter.com/*"] }, [
        "blocking",
        "responseHeaders",
    ]);

    addContextMenus();

    (async () => {
        // attempt to update version settings
        await migrateSettings();
        await startNotifications();
    })();
} catch (e) {
    console.error(e);
}
