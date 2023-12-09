import { getCurrentTabId, isFirefox } from "./core/common/common";
import { JSONToFormData } from "./core/common/dom";
import { fetchSafe } from "./core/common/fetch";
import { alarmNotifications, notificationClicked, setInitialNotificationsEventId } from "./core/notifications";
import { migrateSettings } from "./core/settings";

// use non-async response here due to: https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
chrome.runtime.onMessage.addListener(
	(
		request: OnMessageRequest,
		_: chrome.runtime.MessageSender,
		sendResponse: any,
	) => {
		try {
			if (request.name === "scrollByKeyFix" && isFirefox()) {
				// scroll-by-key fix for Chatty
				getCurrentTabId().then((tabId) => {
					chrome.scripting
						.executeScript({
							target: { tabId },
							files: ["patches/nuScrollByKeyFix.js"],
						})
						.then((r) => {
							sendResponse(r);
						});
				});
			} else if (request.name === "corbFetch") {
				const fetchArgs: FetchArgs = {
					url: request.url as string,
					fetchOpts: request.fetchOpts,
					parseType: request.parseType,
				};
				fetchSafe(fetchArgs).then((response) => {
					sendResponse(response);
				});
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
				fetchSafe(fetchArgs).then((response) => {
					sendResponse(response);
				});
			}
			return true;
		} catch (e) {
			console.error(e);
		}
	},
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
    periodInMinutes: 1,
  });
})();
