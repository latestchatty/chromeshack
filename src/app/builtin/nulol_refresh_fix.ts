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
        // nuLOL tag refresh causes issues on Firefox so only apply to Chrome
        window.chrome && fullPostsCompletedEvent.addHandler(NuLOLFix.apply);
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
        if (oneline && from_reply) {
            if (CS_Instance.debugEvents) console.log("trying to scroll reply into view:", post, matched, oneline);
            oneline.click();
            // try to make sure replies are scrolled into view
            scrollToElement(post);
        }
        // raise the processPost event on the root post so listeners are notified
        if (matched) processPostEvent.raise(root);
    },

    postTagDataHandler(post, root) {
        // prevent duplicate tag counts from being shown after a refresh
        const postTagCounts = post && post.querySelectorAll("span.tag-counts:not(.hidden)");
        const rootTagCounts = root && root.querySelectorAll(".root > ul > li > .fullpost span.tag-counts:not(.hidden)");
        // hide everything but the first .tag-counts container (post & root)
        for (let i = 1; postTagCounts && i < postTagCounts.length && postTagCounts.length > 1; i++) {
            if (!postTagCounts[i].classList.contains("hidden")) {
                if (CS_Instance.debugEvents)
                    console.log("cleaning up post tagline after nuLOL tag update:", postTagCounts[i], i);
                postTagCounts[i].classList.add("hidden");
            }
        }
        for (let j = 1; rootTagCounts && j < rootTagCounts.length && rootTagCounts.length > 1; j++) {
            if (!rootTagCounts[j].classList.contains("hidden")) {
                if (CS_Instance.debugEvents)
                    console.log("cleaning up root tagline after nuLOL tag update:", rootTagCounts[j], j);
                rootTagCounts[j].classList.add("hidden");
            }
        }
        // move the taglines to the correct parent to "fix" Chatty behavior
        const rootAuthorLine = root && root.querySelector("span.author");
        const postAuthorLine = post && post.querySelector("span.author");
        if (
            rootAuthorLine &&
            rootTagCounts &&
            rootTagCounts.length > 0 &&
            rootTagCounts[0].matches("span.user .tag-counts")
        )
            rootAuthorLine.appendChild(rootTagCounts[0]);

        if (
            postAuthorLine &&
            postTagCounts &&
            postTagCounts.length > 0 &&
            postTagCounts[0].matches("span.user .tag-counts")
        )
            postAuthorLine.appendChild(postTagCounts[0]);
    },
};

export default NuLOLFix;
