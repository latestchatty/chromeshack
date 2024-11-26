import { migrateSettings } from "@/components/core/settings";
import { init, notifyClickHandler, onMessageHandler } from "@/components/serviceWorker_helpers";

export default defineBackground(async () => {
  browser.runtime.onMessage.addListener(onMessageHandler);

  await migrateSettings();

  browser.notifications.onClicked.addListener(notifyClickHandler);
  browser.notifications.onButtonClicked.addListener(notifyClickHandler);

  await init();
});
