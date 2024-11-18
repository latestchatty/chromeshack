import { disableScrollRestore, scrollToElement } from "@/components/core/common/dom";
import { fullPostsCompletedEvent } from "@/components/core/events";
import { getEnabledBuiltin } from "@/components/core/settings";

/*
 *  Fix visible fullpost position when opening a post in single-thread mode
 */
export const SingleThreadFix = {
  async fix() {
    // only do fix when NOT on main Chatty
    if (document.querySelector("div#newcommentbutton")) return;

    // disable scroll position restoration on single-threads
    await disableScrollRestore();

    const urlRgx = window.location.href.match(/id=(\d+)(?:#item_(\d+))?/);
    if (!urlRgx) return;

    const rootid = Number.parseInt(urlRgx?.[1], 10) || null;
    const postid = Number.parseInt(urlRgx?.[2], 10) || null;
    const post = document.getElementById(`item_${postid || rootid}`);
    if (post) {
      console.log("scrolling to single-thread:", post);
      scrollToElement(post, { toFit: true });
    }
  },
  apply() {
    // try to ensure the fix applies once the post is loaded
    setTimeout(async () => await SingleThreadFix.fix(), 250);
  },

  async install() {
    const isEnabled = await getEnabledBuiltin("single_thread_fix");
    if (!isEnabled) return;

    fullPostsCompletedEvent.addHandler(SingleThreadFix.apply);
  },
};
