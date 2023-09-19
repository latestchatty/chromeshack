import browser from "webextension-polyfill";
import { fetchSafe } from "./core/common/fetch";
import { JSONToFormData } from "./core/common/dom";
import { startNotifications } from "./core/notifications";
import { migrateSettings } from "./core/settings";

try {
    (async () => {
        browser.runtime.onMessage.addListener(
            async (request: OnMessageRequest): Promise<any> => {
                try {
                    if (request.name === "corbFetch") {
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
                                method: request.fetchOpts?.method ? request.fetchOpts.method : "POST",
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
            },
        );

        // attempt to migrate legacy settings on startup
        await migrateSettings();
        // spin up the notification polling service
        // await startNotifications();
    })();
} catch (e) {
    console.error(e);
}
