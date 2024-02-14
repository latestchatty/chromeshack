import { elementIsVisible, scrollToElement } from "../core/common/dom";
import { processPostEvent, processUncapThreadEvent } from "../core/events";
import { getEnabledBuiltin } from "../core/settings";

/*
 *  Workaround for busted scroll-to-post in clickItem() when uncapping root posts
 */
export const ScrollToUncappedPostFix = {
  uncapped: -1,

  detect({ root, rootid }: UncapThreadEventArgs) {
    if (root != undefined) ScrollToUncappedPostFix.uncapped = rootid;
  },

  fix({ post, rootid, postid }: PostEventArgs) {
    const _uncapped = ScrollToUncappedPostFix.uncapped;
    if (_uncapped === rootid && !elementIsVisible(post)) {
      // scroll-to-post when uncapping a thread
      console.log("scrollToUncappedPostFix thread:", post, rootid, _uncapped);
      scrollToElement(post, { toFit: true });
    } else if (_uncapped === postid && !elementIsVisible(post, true)) {
      // try to scroll-to-post when an opened fullpost is offscreen
      console.log("scrollToUncappedPostFix post:", post, rootid, postid, _uncapped);
      scrollToElement(post);
    }
  },

  async install() {
    const isEnabled = await getEnabledBuiltin("uncapped_thread_fix");
    const isChatty = document.getElementById("newcommentbutton");
    if (!isEnabled || !isChatty) return;

    processUncapThreadEvent.addHandler(ScrollToUncappedPostFix.detect);
    processPostEvent.addHandler(ScrollToUncappedPostFix.fix);
  },
};
