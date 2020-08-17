const migrateSettings = async () => {
    let legacy_settings = getSettingsLegacy();
    let last_version = await getSetting("version", 0);
    let current_version = parseFloat(browser.runtime.getManifest().version);
    if (legacy_settings && legacy_settings["version"] <= 1.63) {
        // quick reload from default settings of nustorage
        await resetSettings().then(getSettings);
        // preserve previous convertible filters and notifications state
        let prevFilters = legacy_settings["user_filters"] || null;
        let prevNotifyUID = legacy_settings["notificationuid"] || null;
        let prevNotifyState = legacy_settings["notifications"] || null;
        if (prevFilters) await setSetting("user_filters", prevFilters);
        if (prevNotifyUID && prevNotifyState) {
            await setSetting("notificationuid", prevNotifyUID);
            await setEnabled("enable_notifications");
        }
        window.localStorage.clear();
    }
    if (last_version !== current_version) browser.tabs.create({ url: "release_notes.html" });
    await setSetting("version", current_version);
};

var notificationsEventId = 0;

const startNotifications = async () => {
    await setInitialNotificationsEventId();
    browser.notifications.onClicked.addListener(notificationClicked);
    await pollNotifications();
};

const setInitialNotificationsEventId = async () => {
    const resp = await fetchSafe({
        url: "https://winchatty.com/v2/getNewestEventId",
        fetchOpts: { method: "GET" }
    });
    notificationsEventId = resp.eventId;
};

function matchNotification(loggedInUsername, post, parentAuthor) {
    if (typeof loggedInUsername === 'string' && loggedInUsername !== '') {
        const me = loggedInUsername.toLowerCase();
        if (post.body.includes(me)) {
            return "Post contains your name.";
        } else if (me === (parentAuthor || '').toLowerCase()) {
            return "Replied to you.";
        }
    }
    return null;
}

const pollNotifications = async () => {
    if (await getEnabled("enable_notifications")) {
        const username = await getSetting("username") || '';

        return await fetchSafe({
            url: "https://winchatty.com/v2/pollForEvent?includeParentAuthor=true&lastEventId=" + notificationsEventId,
            fetchOpts: { method: "GET" }
        }).then(async resp => {
            let notifications = resp;
            if (!notifications.error) {
                for (let i = 0; i < notifications.events.length; i++) {
                    let n = notifications.events[i];
                    if (n.eventType === "newPost") {
                        var match = matchNotification(username, n.eventData.post, n.eventData.parentAuthor);
                        if (match !== null) {
                            browser.notifications.create("ChromeshackNotification" + n.eventData.post.id.toString(), {
                                type: "basic",
                                title: "New post by " + n.eventData.post.author,
                                message: match,
                                iconUrl: "images/icon.png"
                            });
                        }
                    }
                }
                notificationsEventId = notifications.lastEventId;
                //If everything was successful, poll again in 15 seconds.
                setTimeout(pollNotifications, 15000);
            } else if (notifications.code === "ERR_TOO_MANY_EVENTS") {
                await setInitialNotificationsEventId();
                setTimeout(pollNotifications, 15000);
            } else {
                setTimeout(pollNotifications, 60000);
            }
        }).catch(async err => {
            console.log(err);
            setTimeout(pollNotifications, 60000);
        });
    }
};

const notificationClicked = notificationId => {
    if (notificationId.indexOf("ChromeshackNotification") > -1) {
        let postId = notificationId.replace("ChromeshackNotification", "");
        let url = "https://www.shacknews.com/chatty?id=" + postId + "#item_" + postId;
        browser.tabs.create({ url: url });
        browser.notifications.clear(notificationId);
    }
};

browser.runtime.onMessage.addListener(async (request, sender) => {
    if (request.name === "launchIncognito")
        // necessary for opening nsfw links in an incognito window
        return Promise.resolve(browser.windows.create({ url: request.value, incognito: true }));
    else if (request.name === "allowedIncognitoAccess")
        // necessary for knowing when to open nsfw media in an incognito window
        return Promise.resolve(browser.extension.isAllowedIncognitoAccess());
    else if (request.name === "chatViewFix") {
        // scroll-to-post fix for Chatty
        return browser.tabs
            .executeScript(null, { code: `window.monkeyPatchCVF === undefined` })
            .then(res => {
                if (res) {
                    browser.tabs.executeScript({ file: "int/chatViewFix.js" });
                }
            })
            .catch(err => console.log(err.message ? err.message : err));
    } else if (request.name === "injectLightbox") {
        // a media element's HTML is passed into the to-be-injected lightbox instantiator here
        return browser.tabs
            .executeScript(null, { code: `window.basicLightbox === undefined` })
            .then(res => {
                const injectLightboxFunc = () => {
                    browser.tabs
                        .executeScript(null, { code: `var _mediaHTML = \`${request.elemText}\`;` })
                        .then(() => browser.tabs.executeScript(null, { file: "int/injectLightbox.js" }));
                };

                if (res) {
                    browser.tabs
                        .executeScript(null, { file: "ext/basiclightbox/basicLightbox.min.js" })
                        .then(injectLightboxFunc);
                } else {
                    injectLightboxFunc();
                }
            })
            .catch(err => console.log(err.message ? err.message : err));
    } else if (request.name === "injectCarousel") {
        // we pass an element's css selector into Swiper for carousel injection here
        return browser.tabs
            .executeScript(null, { code: `window.Swiper === undefined` })
            .then(res => {
                if (res) {
                    browser.tabs
                        .executeScript(null, { file: "ext/swiper/swiper.js" })
                        .then(() =>
                            browser.tabs
                                .executeScript(null, { code: `var _carouselSelect = "${request.select}";` })
                                .then(() => browser.tabs.executeScript(null, { file: "int/injectCarousel.js" }))
                        );
                } else {
                    browser.tabs
                        .executeScript(null, { code: `var _carouselSelect = "${request.select}";` })
                        .then(() => browser.tabs.executeScript(null, { file: "int/injectCarousel.js" }));
                }
            })
            .catch(err => console.log(err.message ? err.message : err));
    } else if (request.name === "scrollByKeyFix") {
        // scroll-by-key fix for Chatty
        return browser.tabs.executeScript(null, { file: "int/scrollByKeyFix.js" }).catch(err => console.log(err));
    } else if (request.name === "corbFetch") return fetchSafe({
        url: request.url,
        fetchOpts: request.fetchOpts,
        parseType: request.parseType
    });
    else if (request.name === "corbPost") {
        let _fd = await JSONToFormData(request.data);
        return new Promise((resolve, reject) => {
            return fetchSafe({
                url: request.url,
                fetchOpts: {
                    method: "POST",
                    headers: request.headers,
                    body: _fd
                },
                parseType: request.parseType
            })
                .then(resolve)
                .catch(reject);
        });
    }

    return Promise.resolve();
});

/*
    Workaround for Twitter API's lack of support for cross-domain JSON fetch.
    NOTE: we override only responses from "api.twitter.com" and sanitize the fetch result
        with a fetch() helper in common.js so only non-HTML containing JSON is ever used.
*/
const responseListener = details => {
    details.responseHeaders.push({ name: "Access-Control-Allow-Headers", value: "*" });
    details.responseHeaders.push({ name: "Access-Control-Allow-Methods", value: "GET" });
    return { responseHeaders: details.responseHeaders };
};
browser.webRequest.onHeadersReceived.removeListener(responseListener);
browser.webRequest.onHeadersReceived.addListener(responseListener, { urls: ["https://api.twitter.com/*"] }, [
    "blocking",
    "responseHeaders"
]);

(async () => {
    // attempt to update version settings
    await migrateSettings();

    await startNotifications();
})();
