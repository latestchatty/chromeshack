import { scrollToElement } from "../core/common";
import { CS_Instance } from "../content";
import {
    processPostEvent,
    fullPostsCompletedEvent,
    processRefreshIntentEvent,
    processPostRefreshEvent,
    processEmptyTagsLoadedEvent,
    processTagDataLoadedEvent,
} from "../core/events";

/*
 *  Attempt to workaround Chatty's nuLOL API data not loading after replying/refreshing posts
 */

const NuLOLFix = {
    install() {
        fullPostsCompletedEvent.addHandler(NuLOLFix.apply);
    },

    apply() {
        // intercept intent events (refresh/reply) that include the post and root ids
        processRefreshIntentEvent.addHandler(NuLOLFix.preRefreshHandler);
        // intercept the event that fires after tag data has loaded
        processPostRefreshEvent.addHandler(NuLOLFix.postReplyHandler);
        // intercept the post-tag data event batch
        processTagDataLoadedEvent.addHandler(NuLOLFix.postTagDataHandler);
        processEmptyTagsLoadedEvent.addHandler(NuLOLFix.postTagDataHandler);
    },

    preRefreshHandler(postid: string, rootid: string) {
        if (CS_Instance.debugEvents) console.log("preRefreshHandler:", postid, rootid);
        // click the root refresh to refresh tag data for the whole thread
        const root = document.querySelector(`#root_${rootid} > ul > li`);
        const rootRefreshBtn = root?.querySelector(".refresh > a") as HTMLLinkElement;
        const matched = CS_Instance.refreshingThreads[rootid];
        // don't rerun this if we're already refreshing
        if (rootRefreshBtn && !matched) {
            if (CS_Instance.debugEvents) console.log("attempting to refresh the thread tag data:", root);
            rootRefreshBtn.click();
        }
    },

    postReplyHandler(post: HTMLElement, root: HTMLElement) {
        // reopen the saved post
        const rootid = root?.id?.substr(5);
        const matched = CS_Instance.refreshingThreads[rootid];
        const { from_reply } = matched || {};
        const oneline = post?.querySelector(`.oneline_body`) as HTMLElement;
        if (CS_Instance.debugEvents) console.log("postReplyHandler:", post, matched, oneline);
        // try to make sure replies are scrolled into view
        if (oneline && from_reply) {
            oneline.click();
            scrollToElement(post);
        } else if (oneline) oneline.click();
        // raise the processPost event on the root post so listeners are notified
        if (matched) processPostEvent.raise(root);
    },

    postTagDataHandler(post: HTMLElement, root: HTMLElement, postTags: HTMLElement[], rootTags: HTMLElement[]) {
        // avoid processing posts with "correct" tagline positions
        const badTagCounts = post?.querySelectorAll("li.sel .fullpost > .postmeta span.user .tag-counts");
        const iconLines = post?.querySelectorAll(
            "li.sel .fullpost > .postmeta a.shackmsg, li.sel .fullpost > .postmeta .chatty-user-icons",
        );
        for (const tagCount of badTagCounts || []) {
            if (
                tagCount?.previousElementSibling?.matches("span.tag-counts") &&
                !tagCount?.classList?.contains("hidden")
            ) {
                if (CS_Instance.debugEvents) console.log("hiding duplicate tagcount:", tagCount);
                tagCount?.classList?.add("hidden");
            }
        }
        for (const icon of iconLines || []) {
            const userLine = icon?.closest(".postmeta")?.querySelector("span.user");
            const tagLine = userLine?.querySelector(".lol-tags");
            tagLine?.parentNode?.insertBefore(icon, tagLine);
        }
    },
};

export default NuLOLFix;
