import { timeOverThresh } from "../core/common/common";
import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script

export const NewCommentHighlighter = {
  timeout: 1000 * 60 * 60 * 1, // 1 hour stale threshold

  async install() {
    processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
    fullPostsCompletedEvent.addHandler(NewCommentHighlighter.highlight);
  },

  async highlight(args?: PostEventArgs) {
    const { root } = args || {};
    const isEnabled = await enabledContains(["new_comment_highlighter"]);
    if (isEnabled) {
      const lastId = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
      const staleIdCheck = await NewCommentHighlighter.checkStaleIdTime(NewCommentHighlighter.timeout);
      const isChatty = document.getElementById("newcommentbutton");

      let newId = -1;
      if (staleIdCheck || root || !isChatty || lastId === -1)
        newId = NewCommentHighlighter.findLastID(root);

      if (newId <= lastId || newId === -1) return;

      await NewCommentHighlighter.highlightPostsAfter(lastId, root);
      await NewCommentHighlighter.updateLastId(newId);
    }
  },

  async updateLastId(newId: number) {
    const lastId = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
    if (newId > lastId) await setSetting("new_comment_highlighter_last_id", newId);
  },

  findLastID(root?: HTMLElement) {
    // 'oneline0' is applied to highlight the most recent post in each thread
    // we only want the first one, since the top post will contain the most recent reply
    const mostRecent = (root || document).querySelector("div.oneline0") as HTMLElement;
    const recentId = parseInt(mostRecent?.parentElement?.id?.substring(5), 10);
    return recentId > -1 ? recentId : -1;
  },

  async checkStaleIdTime(delayInMs: number, reset?: boolean) {
    const now = Date.now();
    const lastHighlightTime = (await getSetting("last_highlight_time", -1)) as number;
    const overThresh = delayInMs ? timeOverThresh(lastHighlightTime, delayInMs) : false;
    if (reset || overThresh || lastHighlightTime == -1) {
      await setSetting("last_highlight_time", now);
      return true;
    }
    return false;
  },

  async highlightPostsAfter(lastId: number, root?: HTMLElement) {
    // grab all the posts with post ids after the last post id we've seen
    const newer = [] as Element[];
    // abort if last_id is -1, meaning we haven't seen any posts yet
    if (lastId === -1) return;

    const oneliners = [...(root || document).querySelectorAll("li[id^='item_']")];
    const process = async (li: HTMLElement, i: number, arr: any[]) => {
      const isNewer = parseInt(li?.id?.substring(5), 10) >= lastId;
      const preview = li.querySelector(".oneline_body");
      const isHighlighted = preview?.classList?.contains("newcommenthighlighter");
      if (isNewer && !isHighlighted) {
        preview?.classList?.add("newcommenthighlighter");
        newer.push(li);
      }
      if (i === arr.length - 1) {
        // update our "Comments ..." blurb at the top of the thread list
        let commentDisplay = document.getElementById("chatty_settings");
        if (commentDisplay) commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
        const commentsCount = commentDisplay?.textContent?.split(" ")[0];
        const newComments = commentsCount && `${commentsCount} Comments (${newer.length} New)`;
        if (newComments) commentDisplay.textContent = newComments;
      }
    };
    await Promise.all(oneliners.map(process));
  },
};
