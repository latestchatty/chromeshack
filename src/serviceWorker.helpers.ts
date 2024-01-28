import { getCurrentTabId } from "./core/common/common";
import { JSONToFormData } from "./core/common/dom";
import { fetchSafe } from "./core/common/fetch";
import { alarmNotifications, notificationClicked, setInitialNotificationsEventId } from "./core/notifications";
import { migrateSettings } from "./core/settings";
import { requiredOrigin } from "./permissions";

export const injectAZScrollFix = (request: OnMessageRequest, sendResponse: any) => {
  // scroll-by-key fix for Chatty
  if (request.name === "scrollByKeyFix") {
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
  }
};

export const commonBackgroundListeners = (request: OnMessageRequest, sendResponse: any) => {
  if (request.name === "corbFetch") {
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
        method: request.fetchOpts?.method ? request.fetchOpts.method : "POST",
        body: _fd,
      },
      parseType: request.parseType,
    };
    fetchSafe(fetchArgs).then((response) => {
      sendResponse(response);
    });
  }
};

export const init = async () => {
  // spin up the notification polling service
  chrome.notifications.onClicked.addListener(notificationClicked);
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "notification-alarm") {
      await alarmNotifications();
    }
  });

  // attempt to migrate legacy settings on startup
  await migrateSettings();
  await setInitialNotificationsEventId();
  chrome.alarms.create("notification-alarm", {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });
};

export const initPermissionsListeners = () => {
  chrome.runtime.onInstalled.addListener((details) => {
    // only show the Preferences->Permissions panel if we're in Firefox
    if (details.reason === "install") {
      console.log("serviceWorker caught an permissions.onInstalled message!");
      chrome.runtime.openOptionsPage();
    } else if (details.reason === "update") {
      console.log("serviceWorker caught a permissions.onRemoved message!");
      chrome.runtime.openOptionsPage();
    }
  });
  chrome.permissions.onAdded.addListener(async (permissions) => {
    const isGranted = permissions.origins.includes(requiredOrigin);
    console.log("permission.onAdded:", isGranted);
    chrome.runtime.sendMessage({ type: "permissions_granted", permissions: permissions });
  });
  chrome.permissions.onRemoved.addListener(async (permissions) => {
    const isGranted = permissions.origins.includes(requiredOrigin);
    console.log("permission.onRemoved:", isGranted);
    chrome.runtime.sendMessage({ type: "permissions_removed", permissions: permissions });
  });
};
