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
        processPostRefreshEvent.addHandler(NuLOLFix.postRefreshHandler);
        // intercept the post-tag data event batch
        processTagDataLoadedEvent.addHandler(NuLOLFix.postTagDataHandler);
        processEmptyTagsLoadedEvent.addHandler(NuLOLFix.postTagDataHandler);
    },

    preRefreshHandler(postId, rootId) {
        // click the root refresh to refresh tag data for the whole thread
        let _rootId = rootId && typeof rootId !== "string" ? rootId.id.substr(5) : rootId;
        let root = document.querySelector(`#root_${_rootId} > ul > li`);
        let rootRefreshBtn = root && root.querySelector(".refresh > a");
        let matched = CS_Instance.refreshingThreads[_rootId];
        // don't rerun this if we're already refreshing
        if (rootRefreshBtn && !matched) {
            if (CS_Instance.debugEvents) console.log("attempting to refresh the thread tag data:", root);
            (<HTMLButtonElement>rootRefreshBtn).click();
        }
    },

    postRefreshHandler(post, root) {
        // reopen the saved post
        let rootId = root && root.id.substr(5);
        let oneline = post && post.querySelector(".oneline_body");
        let matched = CS_Instance.refreshingThreads[rootId];
        if (matched) {
            if (oneline && matched.from_reply) {
                // try to make sure replies are scrolled into view
                oneline.click();
                if (CS_Instance.debugEvents) console.log("trying to scroll reply into view:", post, matched);
                scrollToElement(post);
            }
            // raise the processPost event on the root post so listeners are notified
            processPostEvent.raise(root);
        }
    },

    postTagDataHandler(post, root) {
        // prevent duplicate tag counts from being shown after a refresh
        let postTagCounts = post && post.querySelectorAll("span.tag-counts:not(.hidden)");
        let rootTagCounts = root && root.querySelectorAll(".root > ul > li > .fullpost span.tag-counts:not(.hidden)");
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
        let rootAuthorLine = root && root.querySelector("span.author");
        let postAuthorLine = post && post.querySelector("span.author");
        if (
            rootAuthorLine &&
            rootTagCounts &&
            rootTagCounts.length > 0 &&
            rootTagCounts[0].matches("span.user .tag-counts")
        ) {
            rootAuthorLine.appendChild(rootTagCounts[0]);
        }
        if (
            postAuthorLine &&
            postTagCounts &&
            postTagCounts.length > 0 &&
            postTagCounts[0].matches("span.user .tag-counts")
        ) {
            postAuthorLine.appendChild(postTagCounts[0]);
        }
    },
};

export default NuLOLFix;
