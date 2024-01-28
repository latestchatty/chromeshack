import { arrHas } from "./common/common";
import { fetchSafe } from "./common/fetch";
import { processNotifyEvent } from "./events";
import { enabledContains, getEnabled, getSetting, setSetting } from "./settings";

export const getEventId = async () => (await getSetting("last_eventid")) as number;
export const setEventId = async (eventId: number) => await setSetting("last_eventid", eventId);
export const getUsername = async () => (await getSetting("username")) as string;
export const setUsername = async (username: string) => await setSetting("username", username);

export const TabMessenger = {
  send(msg: NotifyMsg) {
    // NOTE: call this from a background script
    chrome.tabs.query({ url: "https://*.shacknews.com/chatty*" }).then((tabs) => {
      for (const tab of tabs || []) chrome.tabs.sendMessage(tab.id as number, msg);
    });
  },
  connect() {
    // NOTE: call this from a content script
    chrome.runtime.onMessage.addListener((msg: NotifyMsg) => {
      if (msg.name === "notifyEvent") return Promise.resolve(processNotifyEvent.raise(msg.data));

      return Promise.resolve(true);
    });
  },
};

export const setInitialNotificationsEventId = async () => {
  const resp: NewestEventResponse = await fetchSafe({
    url: "https://winchatty.com/v2/getNewestEventId",
  });
  if (!resp) return;
  await setEventId(resp.eventId);
};

export const notificationClicked = (notificationId: string) => {
  if (notificationId.indexOf("ChromeshackNotification") > -1) {
    const postId = notificationId.replace("ChromeshackNotification", "");
    const url = `https://www.shacknews.com/chatty?id=${postId}#item_${postId}`;
    chrome.tabs.create({ url });
    chrome.notifications.clear(notificationId);
  }
};

const matchNotification = async (nEvent: NotifyEvent) => {
  const loggedInUsername = (await getUsername())?.toLowerCase();
  const newPostEvent = nEvent.eventData as NewPostData;
  const matches = (await getSetting("notifications", [])) as string[];
  const parentAuthor = newPostEvent?.parentAuthor?.toLowerCase();
  const postAuthor = newPostEvent?.post?.author?.toLowerCase();
  const postEventBody = newPostEvent?.post?.body?.toLowerCase();
  const postEventHasMe = postEventBody?.includes(loggedInUsername);
  const parentAuthorIsMe = parentAuthor === loggedInUsername;
  const postAuthorIsMe = postAuthor === loggedInUsername;
  const postEventHasMatches =
    postEventBody &&
    matches?.reduce((acc, m) => {
      const mToLower = m.toLowerCase();
      const wasAdded = acc.find((x) => x.toLowerCase() === mToLower.trim());
      // trim extra trailing space from phrase matches for posterity
      if (postEventBody.indexOf(mToLower) > -1 && !wasAdded) acc.push(m.trim());
      return acc;
    }, [] as string[]);
  if (postEventHasMe) return "Someone mentioned your name.";
  else if (parentAuthorIsMe) return "Someone replied to you.";
  else if (!postAuthorIsMe && arrHas(postEventHasMatches as string[])) {
    const message = `Someone mentioned: ${(postEventHasMatches as string[]).join(", ")}`;
    return `${message.slice(0, 115)}...`;
  }
  return null;
};

const handleEventSignal = (msg: NotifyMsg) => TabMessenger?.send(msg);

const handleNotification = async (response: NotifyResponse) => {
  const events = response.events;
  handleEventSignal({ name: "notifyEvent", data: response });
  const notify_enabled = await enabledContains(["enable_notifications"]);
  for (const event of events || [])
    if (event.eventType === "newPost") {
      const match = await matchNotification(event);
      const post = (event.eventData as NewPostData)?.post;
      if (notify_enabled && match && post)
        chrome.notifications.create(`ChromeshackNotification${post?.id?.toString()}`, {
          type: "basic",
          title: `New post by ${post.author}`,
          message: match,
          iconUrl: "images/icon.png",
        });
    }
};

export const alarmNotifications = async () => {
  try {
    const enabled = (await getEnabled("enable_notifications")) || (await getEnabled("highlight_pending_new_posts"));
    if (!enabled) return;

    let nEventId = await getEventId();
    let resp: NotifyResponse = null;
    if (!nEventId) {
      // avoid getting hung in a tock loop if saved id is unusable
      await setInitialNotificationsEventId();
      nEventId = await getEventId();
    } else {
      resp = await fetchSafe({
        url: `https://winchatty.com/v2/pollForEvent?includeParentAuthor=true&lastEventId=${nEventId}`,
      });
    }

    console.log("alarmNotifications tick:", nEventId, resp);
    if (resp?.lastEventId && !resp.error) {
      await setEventId(resp.lastEventId);
      await handleNotification(resp);
    } else if (resp?.code === "ERR_TOO_MANY_EVENTS") {
      await setInitialNotificationsEventId();
    }
  } catch (e) {
    console.log(e);
  }
};
