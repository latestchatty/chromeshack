import { fetchSafe } from "./core/common/fetch";
import { JSONToFormData } from "./core/common/dom";
import { isFirefox, getCurrentTabId } from "./core/common/common";
import {
    setInitialNotificationsEventId,
    notificationClicked,
    alarmNotifications
} from "./core/notifications";
import { migrateSettings } from "./core/settings";

chrome.runtime.onMessage.addListener(
    async (request: OnMessageRequest): Promise<any> => {
        try {
            if (request.name === "scrollByKeyFix" && isFirefox())
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

// spin up the notification polling service
chrome.notifications.onClicked.addListener(notificationClicked);
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "notification-alarm") {
        await alarmNotifications();
    }
});

(async () => {
    // attempt to migrate legacy settings on startup
    await migrateSettings();
    await setInitialNotificationsEventId();
    chrome.alarms.create("notification-alarm", {
        delayInMinutes: 1,
        periodInMinutes: 1
    });
})();
