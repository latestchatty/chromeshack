import { timeOverThresh } from "../core/common/common";
import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script

// can be a single record or an array of records in the form of: [rootId]: mostRecentPostId
type RecentsCache = Record<string, number>;

export const NewCommentHighlighter = {
  // minimum time between refreshes to invalidate lastId
  timeout: 1000 * 60 * 60 * 24 * 0.25, // 6 hour watermark

  recentsCache: {} as RecentsCache,

  async install() {
    processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
    fullPostsCompletedEvent.addHandler(NewCommentHighlighter.highlight);
  },

  async highlight(args?: PostEventArgs) {
    const { root, rootid } = args || {};
    const isEnabled = await enabledContains(["new_comment_highlighter"]);
    if (!isEnabled) return;

    const recents = NewCommentHighlighter.getRecentsCache();

    const lastIds = (await getSetting("new_comment_highlighter_last_id", {})) as RecentsCache;
    const lastIdsLen = Object.keys(lastIds).length;
    const lastId =
      lastIdsLen && rootid && lastIds[rootid] ? lastIds[rootid] : lastIdsLen ? Math.max(...Object.values(lastIds)) : 0;
    const newId = NewCommentHighlighter.getRecentId(root);
    let staleId = false;

    console.log(
      `highlight started with: ${lastId} & ${newId} ~= ${lastIdsLen ? JSON.stringify(lastIds) : JSON.stringify({})}`,
    );
    // only bypass stale check if we have a root
    if (!root) staleId = await NewCommentHighlighter.checkStaleTime(NewCommentHighlighter.timeout);
    if (staleId) {
      console.log(`highlight stale: ${lastId} -> ${newId}`);
      await setSetting("new_comment_highlighter_last_id", newId);
      return await NewCommentHighlighter.checkStaleTime(-1, true);
    }
    if (!newId || newId <= lastId)
      return console.log("highlight aborted due to invalid newId or freshness: ", newId, lastId);

    const newestIds = NewCommentHighlighter.highlightPostsAfter(lastId, root);
    if (newestIds && Object.keys(newestIds).length) {
      const newestId = Math.max(...Object.values(newestIds));
      NewCommentHighlighter.recentsCache = { ...recents, ...newestIds };
      console.log(`highlight updated: ${lastId} -> ${newestId}`);
    } else {
      console.log(`highlight aborted due to freshness: ${lastId} <-> ${newId}`);
    }

    await setSetting("new_comment_highlighter_last_id", NewCommentHighlighter.recentsCache);
  },

  getRecentsCache() {
    const roots = [...document.querySelectorAll("div.root > ul > li")];
    const recents =
      roots.length > 0
        ? roots.reduce((acc, r) => {
            const id = Number.parseInt(r.id?.substring(5), 10);
            const newest = r.querySelector("div.oneline0");
            const newestId = Number.parseInt(newest?.parentElement?.id?.substring(5) ?? "0", 10);
            acc[id] = newestId;
            return acc;
          }, {} as RecentsCache)
        : ({} as RecentsCache);

    // don't mutate the live cache - just assign it
    NewCommentHighlighter.recentsCache = { ...NewCommentHighlighter.recentsCache, ...recents };
    return NewCommentHighlighter.recentsCache;
  },
  getRecentId(root?: HTMLElement) {
    if (!Object.keys(NewCommentHighlighter.recentsCache).length) {
      // refresh our cache if empty
      NewCommentHighlighter.getRecentsCache();
    }
    // only return the most recent on the page if we have no root
    if (!root) return Math.max(...Object.values(NewCommentHighlighter.recentsCache));
    // otherwise, look it up in the cache
    const rootId = Number.parseInt(root.id?.substring(5) ?? "0");
    const recentId = NewCommentHighlighter.recentsCache[rootId];
    return recentId || 0;
  },
  filterKeysByNewest(records: RecentsCache[]): RecentsCache {
    const newest = {} as RecentsCache;
    const seenKeys = new Set<string>();
    for (const r of records) {
      for (const k in r) {
        const _k = Number.parseInt(k, 10);
        if (!seenKeys.has(k) || r[_k] > newest[_k]) {
          newest[_k] = r[_k];
          seenKeys.add(k);
        }
      }
    }
    return newest;
  },

  async checkStaleTime(delayInMs: number, reset?: boolean) {
    const now = Date.now();
    if (reset && !delayInMs) {
      console.log("checkStaleTime caught a reset!");
      await setSetting("last_highlight_time", now);
      return false;
    }

    let lastHighlightTime = await getSetting("last_highlight_time", now);
    if (!lastHighlightTime || lastHighlightTime < 0) {
      await setSetting("last_highlight_time", now);
      console.log(`checkStaleTime corrected invalid lastHighlightTime: ${lastHighlightTime}`);
      lastHighlightTime = now;
    }

    const overThresh = timeOverThresh(lastHighlightTime, delayInMs);
    if (!overThresh) {
      console.log(`checkStaleTime fresh: ${lastHighlightTime + delayInMs} > ${now}`);
      return false;
    }
    console.log(`checkStaleTime stale: ${now} > ${lastHighlightTime}`);
    await setSetting("last_highlight_time", now);
    return true;
  },

  highlightPostsAfter(lastId: number, root?: HTMLElement): RecentsCache {
    // try to get a valid lastId if the one we're passed seems invalid
    const _lastId = lastId > 0 ? lastId : NewCommentHighlighter.getRecentId(root);

    const oneliners = [...(root || document).querySelectorAll("li[id^='item_']")];
    const newerPostIds: Record<number, number>[] =
      oneliners?.reduce(
        (acc, v) => {
          const _root = v?.closest("div.root > ul > li");
          const rootId = Number.parseInt(_root?.id?.substring(5) ?? "0", 10);
          const curId = Number.parseInt(v?.id?.substring(5) ?? "0", 10);
          // abort early if we've seen nothing new
          if (curId && curId <= _lastId) return acc;
          // tag these newer oneline spans with a blue bar on the left
          const onelineBody = v?.querySelector(".oneline_body");
          if (onelineBody?.classList?.contains("newcommenthighlighter")) return acc;
          onelineBody?.classList?.add("newcommenthighlighter");
          // add each highlighted post to our accumulator to show the count later
          if (rootId) acc.push({ [rootId]: curId });
          return acc;
        },
        [] as Record<number, number>[],
      ) ?? [];

    let commentDisplay = document.getElementById("chatty_settings");
    if (commentDisplay) commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
    const commentsCount = commentDisplay?.textContent?.split(" ")[0];
    const newComments =
      commentsCount && newerPostIds.length && `${commentsCount} Comments (${newerPostIds.length} New)`;
    if (newComments && commentDisplay) commentDisplay.textContent = newComments;

    const filtered = NewCommentHighlighter.filterKeysByNewest(newerPostIds);
    const newestId = Object.keys(filtered).length ? Math.max(...Object.values(filtered)) : 0;
    if (newestId) console.log(`highlightPostsAfter returned [${lastId} -> ${newestId}]: ${JSON.stringify(filtered)}`);
    return filtered;
  },
};
