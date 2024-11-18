import { getEnabledBuiltin } from "@/components/core/settings";
import {
  injectAZScrollFix,
  commonBackgroundListeners,
  init,
  initPermissionsListeners,
} from "@/components/serviceWorker_helpers";

export default defineBackground(() => {
  // use non-async response here due to: https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
  browser.runtime.onMessage.addListener(
    (request: OnMessageRequest, _: chrome.runtime.MessageSender, sendResponse: any) => {
      if (import.meta.env.BROWSER === "firefox") {
        try {
          getEnabledBuiltin("az_scroll_fix").then((isEnabled) => {
            if (!isEnabled) return;
            injectAZScrollFix(request, sendResponse);
          });
          commonBackgroundListeners(request, sendResponse);
        } catch (e) {
          console.error(e);
        }
        initPermissionsListeners();
      } else {
        try {
          commonBackgroundListeners(request, sendResponse);
        } catch (e) {
          console.error(e);
        }
      }
      return true;
    },
  );

  (async () => {
    await init();
  })();
});
