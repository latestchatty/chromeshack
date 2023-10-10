import browser from "webextension-polyfill";
import { fetchSafe } from "./core/common/fetch";
import { JSONToFormData } from "./core/common/dom";
import { startNotifications } from "./core/notifications";
import { migrateSettings } from "./core/settings";

try {
    (async () => {
        async function getCurrentTabId() {
            let queryOptions = { active: true, lastFocusedWindow: true };
            let [tab] = await browser.tabs.query(queryOptions);
            return tab.id;
        }

        function isFirefox() {
            // @ts-ignore
            return typeof InstallTrigger !== "undefined";
        }

        browser.runtime.onMessage.addListener(
            async (request: OnMessageRequest): Promise<any> => {
                try {
                    if (request.name === "chatViewFix" && isFirefox())
                        // scroll-to-post fix for Chatty
                        return await chrome.scripting.executeScript({
                            target: { tabId: await getCurrentTabId() },
                            files: ["patches/nuChatViewFix.js"],
                        });
                    else if (request.name === "scrollByKeyFix" && isFirefox())
                        // scroll-by-key fix for Chatty
                        return await chrome.scripting.executeScript({
                            target: { tabId: await getCurrentTabId() },
                            files: ["patches/nuScrollByKeyFix.js"],
                        });
                    else if (request.name === "corbFetch") {
                        const fetchArgs: FetchArgs = {
                            url: request.url as string,
                            fetchOpts: request.fetchOpts,
                            parseType: request.parseType,
                        };
                        return fetchSafe(fetchArgs);
                    } else if (request.name === "corbPost") {
                        const _fd = request.data ? JSONToFormData(request.data) : null;
                        const fetchArgs: FetchArgs = {
                            url: request.url as string,
                            fetchOpts: {
                                ...request.fetchOpts,
                                method: request.fetchOpts?.method
                                    ? request.fetchOpts.method
                                    : "POST",
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
            }
        );

        if (!isFirefox()) {
            // we only need offscreen for notifications on Chrome
            async function createOffscreen() {
                await chrome.offscreen
                    .createDocument({
                        url: "src/offscreen.html",
                        reasons: [chrome.offscreen.Reason.BLOBS],
                        justification: "notification polling",
                    })
                    .then(() => {
                        console.log("createOffscreen succeeded!");
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            }
            browser.runtime.onStartup.addListener(createOffscreen);
            self.onmessage = (e: any) => { }; // keepAlive
            await createOffscreen();
        }
        // attempt to migrate legacy settings on startup
        await migrateSettings();
        // spin up the notification polling service
        await startNotifications();
    })();
} catch (e) {
    console.error(e);
}
