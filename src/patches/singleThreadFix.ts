import { scrollToElement } from "../core/common/dom";
import { fullPostsCompletedEvent } from "../core/events";

/*
 *  Fix visible fullpost position when opening a post in single-thread mode
 */
export const singleThreadFix = () => {
  const fix = () => {
    const urlRgx = window.location.href.match(/id=(\d+)(?:#item_(\d+))?/);
    const rootid = parseInt(urlRgx?.[1], 10);
    const postid = parseInt(urlRgx?.[2], 10);
    const post = (rootid === postid || rootid) && document.getElementById(`item_${postid || rootid}`);
    if (post) {
      console.log("scrolling to single-thread:", post);
      scrollToElement(post, { toFit: true });
    }
  };
  fullPostsCompletedEvent.addHandler(fix);
};
