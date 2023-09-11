import { browser } from "webextension-polyfill-ts";
import { fetchSafe, JSONToFormData } from "./core/common";
import { startNotifications } from "./core/notifications";
import { migrateSettings } from "./core/settings";
import { chatViewFix } from "./patches/chatViewFix";
import { scrollByKeyFix } from "./patches/scrollByKeyFix";

browser.runtime.onMessage.addListener(
    async (request: OnMessageRequest): Promise<any> => {
        try {
            if (request.name === "launchIncognito")
                // necessary for opening nsfw links in an incognito window
                return browser.windows.create({ url: request.value, incognito: true });
            else if (request.name === "allowedIncognitoAccess")
                // necessary for knowing when to open nsfw media in an incognito window
                return browser.extension.isAllowedIncognitoAccess();
            else if (request.name === "chatViewFix")
                // scroll-to-post fix for Chatty
                return chatViewFix();
            else if (request.name === "scrollByKeyFix")
                // scroll-by-key fix for Chatty
                return scrollByKeyFix();
            else if (request.name === "corbFetch") {
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
                        ...request.fetchOpts,
                        method: request.fetchOpts?.method ? request.fetchOpts.method : "POST",
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

try {
    (async () => {
        // attempt to migrate legacy settings on startup
        await migrateSettings();
        // spin up the notification polling service
        await startNotifications();
    })();
} catch (e) {
    console.error(e);
}
