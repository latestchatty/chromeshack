import { browser } from "webextension-polyfill-ts";

import { fetchSafe } from "./common";
import { getSetting, setSetting, getEnabled } from "./settings";

export const getEventId = async () => (await getSetting("nEventId")) as Promise<number>;
export const setEventId = async (eventId: number) => await setSetting("nEventId", eventId);
export const getUsername = async () => (await getSetting("nUsername")) as Promise<string>;
export const setUsername = async (username: string) => await setSetting("nUsername", username);

export interface NotifyEvent {
    eventData: {
        parentAuthor?: string;
        post?: {
            author?: string;
            body?: string;
            category?: string;
            date?: string;
            id?: number;
            lols?: any[];
            parentId?: number;
            threadId?: number;
        };
        postId?: number;
        updates?: {
            count: number;
            postId: number;
            tag: string;
        }[];
    };
    eventDate: string;
    eventId: number;
    eventType: string;
}
export interface NotifyResponse {
    events: NotifyEvent[] | [];
    lastEventId: number;
    tooManyEvents: boolean;
    error?: boolean;
    code?: string;
    message?: string;
}

const setInitialNotificationsEventId = async () => {
    const resp = await fetchSafe({ url: "https://winchatty.com/v2/getNewestEventId" });
    if (resp) await setEventId(resp.eventId);
};

const notificationClicked = (notificationId: string) => {
    if (notificationId.indexOf("ChromeshackNotification") > -1) {
        const postId = notificationId.replace("ChromeshackNotification", "");
        const url = `https://www.shacknews.com/chatty?id=${postId}#item_${postId}`;
        browser.tabs.create({ url: url });
        browser.notifications.clear(notificationId);
    }
};

const matchNotification = async (nEvent: NotifyEvent) => {
    const loggedInUsername = (await getUsername())?.toLowerCase();
    const parentAuthor = nEvent?.eventData?.parentAuthor?.toLowerCase();
    const postEventHasMe = nEvent?.eventData?.post?.body?.includes(loggedInUsername);
    const parentAuthorIsMe = parentAuthor === loggedInUsername;
    console.log("matchNotification:", loggedInUsername, parentAuthor, postEventHasMe, parentAuthorIsMe, nEvent);
    if (postEventHasMe) {
        return "Post contains your name.";
    } else if (parentAuthorIsMe) {
        return "Replied to you.";
    } else return null;
};

const handleNotification = async (response: NotifyResponse) => {
    const events = response.events;
    for (const event of events || []) {
        if (event.eventType === "newPost") {
            const match = await matchNotification(event);
            if (match && event?.eventData?.post?.author) {
                const post = event.eventData.post;
                browser.notifications.create(`ChromeshackNotification${post.id.toString()}`, {
                    type: "basic",
                    title: "New post by " + post.author,
                    message: match,
                    iconUrl: "images/icon.png",
                });
            }
        }
    }
};

const pollNotifications = async () => {
    const nEventId = await getEventId();
    return await fetchSafe({
        url: `https://winchatty.com/v2/pollForEvent?includeParentAuthor=true&lastEventId=${nEventId}`,
    })
        .then(async (resp: NotifyResponse) => {
            if (!resp.error) {
                await setEventId(resp.lastEventId);
                await handleNotification(resp);
                // If everything was successful, poll again in 15 seconds.
                setTimeout(pollNotifications, 15000);
            } else if (resp.code === "ERR_TOO_MANY_EVENTS") {
                await setInitialNotificationsEventId();
                setTimeout(pollNotifications, 15000);
            } else setTimeout(pollNotifications, 60000);
        })
        .catch((err: any) => {
            console.log(err);
            setTimeout(pollNotifications, 60000);
        });
};

export const startNotifications = async () => {
    /*
     * NOTE: In order to handle notification events in content scripts ...
     * you must send the message from background and receive it in the given script.
     */
    browser.notifications.onClicked.addListener(notificationClicked);
    // only poll for events if requested
    if (await getEnabled("enable_notifications")) {
        await setInitialNotificationsEventId();
        await pollNotifications();
    }
};
