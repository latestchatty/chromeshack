import { getEnabledBuiltin } from "./core/settings";
import { injectAZScrollFix, commonBackgroundListeners, init, initPermissionsListeners } from "./serviceWorker.helpers";

// use non-async response here due to: https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
chrome.runtime.onMessage.addListener(
  (request: OnMessageRequest, _: chrome.runtime.MessageSender, sendResponse: any) => {
    try {
      getEnabledBuiltin("az_scroll_fix").then((isEnabled) => {
        if (!isEnabled) return;
        injectAZScrollFix(request, sendResponse);
      });
      commonBackgroundListeners(request, sendResponse);

      return true;
    } catch (e) {
      console.error(e);
    }
  }
);

initPermissionsListeners();

(async () => {
  await init();
})();
