import { timeOverThresh } from "../core/common/common";
import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script

export const NewCommentHighlighter = {
  // minimum time between refreshes to invalidate lastId
  timeout: 1000 * 60 * 60 * 4, // 4 hours

  recentsCache: {} as Record<number, number>,

  async install() {
    processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
    fullPostsCompletedEvent.addHandler(NewCommentHighlighter.highlight);
  },

  async highlight(args?: PostEventArgs) {
    const { root } = args || {};
    const isEnabled = await enabledContains(["new_comment_highlighter"]);
    if (!isEnabled) return;

    const recents = NewCommentHighlighter.getRecentsCache();

    const lastIds = (await getSetting("new_comment_highlighter_last_id", {})) as Record<number, number>;
    const lastId: number = Object.keys(lastIds).length ? Math.max(...Object.values(lastIds)) : -1;
    const newId = NewCommentHighlighter.getRecentId(root);
    let staleId = false;

    console.log(`highlight started with: ${lastId} & ${newId}`);
    // only bypass stale check if we have a root
    if (!root) staleId = await NewCommentHighlighter.checkStaleTime(NewCommentHighlighter.timeout);
    if (staleId) {
      console.log(`highlight stale: ${lastId} -> ${newId}`);
      await setSetting("new_comment_highlighter_last_id", newId);
      return await NewCommentHighlighter.checkStaleTime(-1, true);
    }
    if (newId <= lastId) return;

    const newestIds = NewCommentHighlighter.highlightPostsAfter(lastId, root);
    const newestId = Object.keys(newestIds).length ? Math.max(...Object.values(newestIds)) : -1;
    NewCommentHighlighter.recentsCache = { ...recents, ...newestIds };
    console.log(`highlight updated: ${lastId} -> ${newestId}`);
    await setSetting("new_comment_highlighter_last_id", NewCommentHighlighter.recentsCache);
  },

  getRecentsCache() {
    const roots = [...document.querySelectorAll("div.root > ul > li")];
    const recents =
      roots.length > 0
        ? roots.reduce(
            (acc, r) => {
              const id = parseInt(r.id?.substring(5), 10);
              const newest = r.querySelector("div.oneline0");
              const newestId = parseInt(newest?.parentElement.id?.substring(5), 10);
              acc[id] = newestId;
              return acc;
            },
            {} as Record<number, number>
          )
        : {};

    // don't mutate the live cache - just assign it
    NewCommentHighlighter.recentsCache = { ...NewCommentHighlighter.recentsCache, ...recents };
    return NewCommentHighlighter.recentsCache;
  },
  getRecentId(root?: HTMLElement) {
    // only return the most recent on the page if we have no root
    if (!root) return Math.max(...Object.values(NewCommentHighlighter.recentsCache));
    // otherwise, look it up in the cache
    const rootId = parseInt(root.id?.substring(5));
    const recentId = NewCommentHighlighter.recentsCache[rootId];
    return recentId > -1 ? recentId : -1;
  },
  filterKeysByNewest(records: Record<number, number>[]): Record<number, number> {
    const newest = {};
    const seenKeys = new Set<string>();
    for (const r of records) {
      for (const k in r) {
        if (!seenKeys.has(k) || r[k] > newest[k]) {
          newest[k] = r[k];
          seenKeys.add(k);
        }
      }
    }
    return newest;
  },

  async checkStaleTime(delayInMs: number, reset?: boolean) {
    const now = Date.now();
    if (reset) {
      console.log("checkStaleTime caught a reset!");
      await setSetting("last_highlight_time", now);
      return false;
    }

    let lastHighlightTime = await getSetting("last_highlight_time", now);
    if (lastHighlightTime === -1) {
      await setSetting("last_highlight_time", now);
      console.log(`checkStaleTime corrected invalid lastHighlightTime: ${lastHighlightTime}`);
      lastHighlightTime = now;
    }

    const overThresh = delayInMs ? timeOverThresh(lastHighlightTime, delayInMs) : false;
    if (!overThresh) {
      console.log(`checkStaleTime fresh: ${lastHighlightTime + delayInMs} > ${now}`);
      return false;
    }
    console.log(`checkStaleTime stale: ${now} > ${lastHighlightTime}`);
    await setSetting("last_highlight_time", now);
    return true;
  },

  highlightPostsAfter(lastId: number, root?: HTMLElement): Record<number, number> {
    // abort if lastId is invalid, meaning we haven't seen any posts yet
    if (Number.isNaN(lastId) || lastId === -1) return {};

    const oneliners = [...(root || document).querySelectorAll("li[id^='item_']")];
    const newerPostIds = oneliners.reduce(
      (acc, v) => {
        const _root = v?.closest("div.root > ul > li");
        const rootId = parseInt(_root?.id?.substring(5), 10);
        const curId = parseInt(v?.id?.substring(5), 10);
        if (curId <= lastId) return acc;
        // tag these newer oneline spans with a blue bar on the left
        const onelineBody = v?.querySelector(".oneline_body");
        if (onelineBody?.classList?.contains("newcommenthighlighter")) return acc;
        onelineBody?.classList?.add("newcommenthighlighter");
        // add each highlighted post to our accumulator to show the count later
        acc.push({ [rootId]: curId });
        return acc;
      },
      [] as Record<number, number>[]
    );
    let commentDisplay = document.getElementById("chatty_settings");
    if (commentDisplay) commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
    const commentsCount = commentDisplay?.textContent?.split(" ")[0];
    const newComments = commentsCount && `${commentsCount} Comments (${newerPostIds.length - 1} New)`;
    if (newComments) commentDisplay.textContent = newComments;

    const filtered = NewCommentHighlighter.filterKeysByNewest(newerPostIds);
    const newestId = Math.max(...Object.values(filtered));
    console.log(`highlightPostsAfter returned [${lastId} -> ${newestId}]: ${JSON.stringify(filtered)}`);
    return filtered;
  },
};
