import type { WebRequest } from "webextension-polyfill-ts";
import { browser } from "webextension-polyfill-ts";
import { FetchArgs, fetchSafe, JSONToFormData } from "./core/common";
import { startNotifications } from "./core/notifications";
import { migrateSettings } from "./core/settings";
import { chatViewFix } from "./patches/chatViewFix";
import { scrollByKeyFix } from "./patches/scrollByKeyFix";

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
                        ...request.fetchOpts,
                        method: request.fetchOpts.method || "POST",
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
        // attempt to migrate legacy settings on startup
        await migrateSettings();
        // spin up the notification polling service
        await startNotifications();
    })();
} catch (e) {
    console.error(e);
}
