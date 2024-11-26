import { JSONToFormData } from "@/components/core/common/dom";
import { fetchSafe } from "@/components/core/common/fetch";
import { alarmNotifications, setInitialNotificationsEventId } from "@/components/core/notifications";
import { requiredOrigin } from "@/entrypoints/options/main";

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

export function onMessageHandler() {
  (request: OnMessageRequest, _: chrome.runtime.MessageSender, sendResponse: any) => {
    try {
      commonBackgroundListeners(request, sendResponse);

      if (import.meta.env.BROWSER === "firefox" && import.meta.env.MANIFEST_VERSION === 3) {
        initPermissionsListeners();
      }
    } catch (e) {
      console.error(e);
    }

    // use non-async response here due to: https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
    return true;
  };
}

export function notifyClickHandler(notificationId: string) {
  if (notificationId.indexOf("ChromeshackNotification") > -1) {
    const postId = notificationId.replace("ChromeshackNotification", "");
    const url = `https://www.shacknews.com/chatty?id=${postId}#item_${postId}`;
    return browser.tabs
      .create({ url })
      .then(() => {
        console.log(`created a tab for ${notificationId} to: ${url}`);
        return browser.notifications.clear(notificationId);
      })
      .catch((error) => {
        console.error(`failed to create tab or clear notification ${notificationId}: ${error}`);
      });
  }
}

export const init = async () => {
  // spin up the notification polling service
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "notification-alarm") {
      await alarmNotifications();
    }
  });

  await setInitialNotificationsEventId();
  browser.alarms.create("notification-alarm", {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });
};

export const initPermissionsListeners = () => {
  browser.runtime.onInstalled.addListener((details) => {
    // only show the Preferences->Permissions panel if we're in Firefox
    if (details.reason === "install") {
      console.log("serviceWorker caught an permissions.onInstalled message!");
      browser.runtime.openOptionsPage();
    } else if (details.reason === "update") {
      console.log("serviceWorker caught a permissions.onRemoved message!");
      browser.runtime.openOptionsPage();
    }
  });
  browser.permissions.onAdded.addListener(async (permissions) => {
    const isGranted = permissions.origins?.includes(requiredOrigin);
    console.log("permission.onAdded:", isGranted);
    browser.runtime.sendMessage({ type: "permissions_granted", permissions: permissions });
  });
  browser.permissions.onRemoved.addListener(async (permissions) => {
    const isGranted = permissions.origins?.includes(requiredOrigin);
    console.log("permission.onRemoved:", isGranted);
    browser.runtime.sendMessage({ type: "permissions_removed", permissions: permissions });
  });
};
