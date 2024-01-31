import { timeOverThresh } from "../core/common/common";
import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script

export const NewCommentHighlighter = {
  // minimum time between refreshes to invalidate lastId
  timeout: 1000 * 60 * 60 * 4, // 4 hours

  async install() {
    processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
    fullPostsCompletedEvent.addHandler(NewCommentHighlighter.highlight);
  },

  async highlight(args?: PostEventArgs) {
    const { root } = args || {};
    const isEnabled = await enabledContains(["new_comment_highlighter"]);
    if (!isEnabled) return;

    const lastId = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
    const staleId = await NewCommentHighlighter.checkStaleTime(NewCommentHighlighter.timeout);
    const newId = NewCommentHighlighter.findLastID(root);
    if (staleId) {
      // if our last highlight time exceeds the timeout we just reset until the next newId
      // console.log(`highlight stale: ${lastId} -> ${newId}`);
      await setSetting("new_comment_highlighter_last_id", newId);
      return await NewCommentHighlighter.checkStaleTime(-1, true);
    }
    if (newId <= lastId) return;

    const newestId = await NewCommentHighlighter.highlightPostsAfter(lastId, root);
    // console.log(`highlight updated: ${lastId} -> ${newestId}`);
    await setSetting("new_comment_highlighter_last_id", newestId);
  },

  findLastID(root?: HTMLElement) {
    // 'oneline0' is applied to highlight the most recent post in each thread
    // we only want the first one, since the top post will contain the most recent reply
    const mostRecent = (root || document).querySelector("div.oneline0") as HTMLElement;
    const recentId = parseInt(mostRecent?.parentElement?.id?.substring(5), 10);
    return recentId > -1 ? recentId : -1;
  },

  async checkStaleTime(delayInMs: number, reset?: boolean) {
    const now = Date.now();
    if (reset) {
      // console.log("checkStaleTime caught a reset!");
      await setSetting("last_highlight_time", now);
      return false;
    }

    // returns true or false based on the time being over a threshold
    const lastHighlightTime = (await getSetting("last_highlight_time", now)) as number;
    const overThresh = delayInMs ? timeOverThresh(lastHighlightTime, delayInMs) : false;

    if (!overThresh || lastHighlightTime === -1) {
      // console.log(`checkStaleTime fresh: ${lastHighlightTime + delayInMs} > ${now}`);
      return false;
    }
    // console.log(`checkStaleTime stale: ${now} > ${lastHighlightTime}`);
    await setSetting("last_highlight_time", now);
    return true;
  },

  async highlightPostsAfter(lastId: number, root?: HTMLElement) {
    // abort if lastId is -1, meaning we haven't seen any posts yet
    if (lastId === -1) return lastId;

    // grab all the posts with post ids after the last post id we've seen
    const oneliners = [...(root || document).querySelectorAll("li[id^='item_']")];
    const newerPostIds = oneliners.reduce(
      (acc, v) => {
        // do some quick sanity checks first
        const curId = parseInt(v?.id?.substring(5), 10);
        if (curId <= lastId) return acc;
        const onelineBody = v?.querySelector(".oneline_body");
        if (onelineBody?.classList?.contains("newcommenthighlighter")) return acc;
        onelineBody?.classList?.add("newcommenthighlighter");
        acc.push(curId);
        return acc;
      },
      [lastId] as number[]
    );

    // update our "Comments ..." blurb at the top of the thread list
    let commentDisplay = document.getElementById("chatty_settings");
    if (commentDisplay) commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
    const commentsCount = commentDisplay?.textContent?.split(" ")[0];
    const newComments = commentsCount && `${commentsCount} Comments (${newerPostIds.length - 1} New)`;
    if (newComments) commentDisplay.textContent = newComments;

    console.log(`highlightPostsAfter: ${lastId} -> ${newerPostIds}`);
    const newestId = Math.max(...newerPostIds);
    return newestId && newestId > -1 ? newestId : lastId;
  },
};
