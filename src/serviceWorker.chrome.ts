import { commonBackgroundListeners, init } from "./serviceWorker.helpers";

// use non-async response here due to: https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
chrome.runtime.onMessage.addListener(
  (request: OnMessageRequest, _: chrome.runtime.MessageSender, sendResponse: any) => {
    try {
      commonBackgroundListeners(request, sendResponse);

      return true;
    } catch (e) {
      console.error(e);
    }
  }
);

(async () => {
  await init();
})();
