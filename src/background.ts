import { browser } from "webextension-polyfill-ts";

import { fetchSafe, JSONToFormData, FetchArgs } from "./core/common";
import {
    resetSettings,
    getSettingsLegacy,
    getSettings,
    getSetting,
    setSetting,
    setEnabled,
    mergeSettings,
    setSettings,
} from "./core/settings";
import { startNotifications } from "./core/notifications";

import chatViewFix from "./patches/chatViewFix";
import scrollByKeyFix from "./patches/scrollByKeyFix";

import type { WebRequest } from "webextension-polyfill-ts";

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
        if (prevNotifyUID && prevNotifyState) await setEnabled("enable_notifications");
        window.localStorage.clear();
    }
    if (last_version <= 1.68 && last_version >= 1.64) {
        // migrate pre-1.69 settings
        const settingsMutation = {
            enabled_scripts: [
                { old: "image_loader", new: "media_loader" },
                { old: "video_loader", new: "media_loader" },
                { old: "embed_socials", new: "social_loader" },
            ],
            enabled_suboptions: [{ old: "es_show_tweet_threads", new: "sl_show_tweet_threads" }],
            notificationuid: null as unknown,
        };
        const mutatedSettings = await mergeSettings(settingsMutation);
        await setSettings(mutatedSettings);
    }
    if (last_version !== current_version) await browser.tabs.create({ url: "release_notes.html" });
    await setSetting("version", current_version);
};

browser.runtime.onMessage.addListener(
    async (request: OnMessageRequest): Promise<any> => {
        try {
            if (request.name === "launchIncognito") {
                // necessary for opening nsfw links in an incognito window
                return browser.windows.create({ url: request.value, incognito: true });
            } else if (request.name === "allowedIncognitoAccess") {
                // necessary for knowing when to open nsfw media in an incognito window
                return browser.extension.isAllowedIncognitoAccess();
            } else if (request.name === "chatViewFix") {
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
                const _fd = request.data ? JSONToFormData(request.data) : null;
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

    (async () => {
        // attempt to update version settings
        await migrateSettings();
        // spin up the notification polling service
        await startNotifications();
    })();
} catch (e) {
    console.error(e);
}
