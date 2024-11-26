import {
  commonBackgroundListeners,
  init,
  initPermissionsListeners,
} from "@/components/serviceWorker_helpers";

export default defineBackground(() => {
  // use non-async response here due to: https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
  browser.runtime.onMessage.addListener(
    (request: OnMessageRequest, _: chrome.runtime.MessageSender, sendResponse: any) => {
      try {
        commonBackgroundListeners(request, sendResponse);
      } catch (e) {
        console.error(e);
      }

      if (import.meta.env.BROWSER === "firefox") {
        initPermissionsListeners();
      }

      return true;
    },
  );

  (async () => {
    await init();
  })();
});
