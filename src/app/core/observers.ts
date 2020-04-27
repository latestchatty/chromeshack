import * as browser from "webextension-polyfill";

import {
    fullPostsCompletedEvent,
    processPostEvent,
    processPostBoxEvent,
    processRefreshIntentEvent,
    processPostRefreshEvent,
    processReplyEvent,
    processEmptyTagsLoadedEvent,
    processTagDataLoadedEvent,
} from "./events";
import { elemMatches, locatePostRefs } from "./common";

// provide an interface with optional properties
interface PostRefreshMutation {
    lastPostId?: string;
    lastRootId?: string;
    is_root?: boolean;
    from_reply?: boolean;
}

const ChromeShack = {
    refreshingThreads: {},

    isPostRefreshMutation: <PostRefreshMutation>{},

    isPostReplyMutation: null,

    hasInitialized: false,

    falseTagEvent: false,

    debugEvents: true,

    install() {
        let username = document.getElementById("user_posts");
        setSetting("username", username && username.innerText || ""); // fire and forget

        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = (mutationsList: MutationRecord[]) => {
            try {
                const attrMutated = mutationsList[0].target as HTMLElement;
                if (mutationsList[0].type === "attributes" && elemMatches(attrMutated, ".tag-container, .lol-tags")) {
                    const lastMutation = mutationsList[mutationsList.length - 1].target as HTMLElement;
                    const mutatedPost: HTMLElement = lastMutation.closest("li[id^='item_'].sel");
                    if (mutatedPost) return ChromeShack.processTagsLoaded(mutatedPost);
                }
                for (const mutation of mutationsList) {
                    const lastMutatedSibling = mutation.previousSibling as HTMLElement;
                    const lastRemoved = mutation.removedNodes[0] as HTMLElement;
                    const mutated = mutation.target as HTMLElement;
                    // flag indicated the user has triggered a fullpost reply
                    if (elemMatches(lastMutatedSibling, ".fullpost") && elemMatches(lastRemoved, ".inlinereply")) {
                        const target: HTMLElement = mutated.closest("li[id^='item_']");
                        const parentId = target?.id?.substr(5) || null;
                        ChromeShack.isPostReplyMutation = parentId;
                    }

                    for (const addedNode of mutation.addedNodes || []) {
                        const added = addedNode as HTMLElement;
                        const addedParent = addedNode?.parentNode as HTMLElement;
                        // the root post was swapped - they probably refreshed or replied to a thread
                        if (elemMatches(added, "div.root") && ChromeShack.isPostReplyMutation)
                            ChromeShack.processReply(ChromeShack.isPostReplyMutation);
                        // check for opening a fullpost
                        if (elemMatches(addedParent, "li[id^='item_']")) {
                            // grab the id from the old node, since the new node doesn't contain the id
                            const is_root = !!elemMatches(addedParent, ".root > ul > li");
                            ChromeShack.processPost(addedParent, addedParent?.id?.substr(5), is_root);
                        }
                        // check for tags loading after a fullpost
                        if (elemMatches(addedParent, "span.user")) ChromeShack.tagsLoadedHandler(added);
                        // check for the postbox
                        if (elemMatches(added, "#postbox")) ChromeShack.processPostBox(added);
                    }
                }
            } catch (e) {
                console.log("A problem occurred when processing a post:", e);
            }
        };
        const observer = new MutationObserver(observer_handler);
        observer.observe(document, {
            characterData: true,
            subtree: true,
            attributeFilter: ["data-tc", "data-uc"],
            childList: true,
        });

        ChromeShack.processFullPosts();

        // subscribe to refresh button clicks so we can pass along the open post ids
        document.addEventListener("click", ChromeShack.refreshHandler);
        // subscribe to processRefreshIntentEvent to enable passing post and root refs around
        processRefreshIntentEvent.addHandler(ChromeShack.refreshIntentHandler);
    },

    refreshHandler(e: MouseEvent) {
        const clickedElem = elemMatches(e.target as HTMLLinkElement, "div.refresh > a");
        const { postid, root, rootid, is_root } = locatePostRefs(clickedElem) || {};
        // check the NuLOLFix refresh list to make sure we don't reprocess the thread
        if (clickedElem && !ChromeShack.refreshingThreads[rootid] && !elemMatches(root, ".refreshing")) {
            root?.closest("div.root")?.classList?.add("refreshing");
            if (ChromeShack.debugEvents) console.log("raising processRefreshIntentEvent:", postid, rootid, is_root);
            processRefreshIntentEvent.raise(postid, rootid, is_root, !!ChromeShack.isPostReplyMutation);
        }
    },

    refreshIntentHandler(lastPostId: string, lastRootId: string, is_root: boolean, from_reply: boolean) {
        // make sure to save the ids of the open posts so we can reopen them later
        ChromeShack.isPostRefreshMutation = {
            lastPostId,
            lastRootId,
            is_root,
            from_reply,
        };
        // keep track of what's being refreshed
        ChromeShack.refreshingThreads[lastRootId] = ChromeShack.isPostRefreshMutation;
        if (ChromeShack.debugEvents) console.log("refreshIntentHandler:", ChromeShack.refreshingThreads[lastRootId]);

        // listen for when tag data gets mutated (avoid duplicates!)
        processEmptyTagsLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
        processTagDataLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
    },

    postRefreshHandler(post: HTMLElement, root: HTMLElement, postHasTags: boolean, rootHasTags: boolean) {
        // should be raised after a post is populated with tag data
        processEmptyTagsLoadedEvent.removeHandler(ChromeShack.postRefreshHandler);
        processTagDataLoadedEvent.removeHandler(ChromeShack.postRefreshHandler);
        const rootId = root?.id?.substr(5);
        if (ChromeShack.debugEvents)
            console.log("raising processPostRefreshEvent:", post, root, postHasTags, rootHasTags);
        // make sure we're using the most up-to-date ref to the post element
        const lastPostId = ChromeShack.isPostRefreshMutation?.lastPostId;
        // if we're called from a reply handler that can't pass a postId then find it ourselves
        const _post: HTMLElement = (lastPostId && document.querySelector(`li#item_${lastPostId}`)) || post;
        if (_post || root) processPostRefreshEvent.raise(_post, root, postHasTags, rootHasTags);
        // since we're done refreshing remove this thread from our tracking list
        delete ChromeShack.refreshingThreads[rootId];
        ChromeShack.isPostRefreshMutation = {};
    },

    tagsLoadedHandler(item: HTMLElement) {
        // only process tag mutation and post mutation events
        if (!item.matches("li[id^='item_'], span.lol-tags, span.user")) return;
        const { post, root } = locatePostRefs(item) || {};
        const rootUpdatedTags = root && root.querySelectorAll(".tag-container.nonzero");
        const postUpdatedTags = post && post.querySelectorAll(".tag-container.nonzero");
        const rootHasTags = rootUpdatedTags ? rootUpdatedTags.length > 0 : false;
        const postHasTags = postUpdatedTags ? postUpdatedTags.length > 0 : false;
        if ((post || root) && (postHasTags || rootHasTags)) {
            if (ChromeShack.debugEvents)
                console.log("raising processTagDataLoadedEvent:", post, root, postHasTags, rootHasTags);
            processTagDataLoadedEvent.raise(post, root, postHasTags, rootHasTags);
        } else if (post || root) {
            if (ChromeShack.debugEvents)
                console.log("raising processEmptyTagsLoadedEvent:", post, root, postHasTags, rootHasTags);
            processEmptyTagsLoadedEvent.raise(post, root, postHasTags, rootHasTags);
        }
    },

    processFullPosts() {
        // process fullposts
        const items = [...document.querySelectorAll("div.fullpost")];
        for (const item of items || []) {
            const { post, rootid, is_root } = locatePostRefs(item as HTMLElement) || {};
            if (post && rootid) ChromeShack.processPost(post, rootid, is_root);
        }
        if (ChromeShack.debugEvents) console.log("raising fullPostsCompletedEvent");
        fullPostsCompletedEvent.raise();
        ChromeShack.hasInitialized = true;

        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({ name: "chatViewFix" });
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({ name: "scrollByKeyFix" });
    },

    processPost(post: HTMLElement, rootid: string, is_root: boolean) {
        if (ChromeShack.debugEvents) console.log("raising processPostEvent:", post, rootid, is_root);
        processPostEvent.raise(post, rootid, is_root);
    },

    processPostBox(postbox: HTMLElement) {
        if (ChromeShack.debugEvents) console.log("raising processPostBoxEvent:", postbox);
        if (postbox) processPostBoxEvent.raise(postbox);
    },

    processTagsLoaded(item: HTMLElement) {
        /* if (!ChromeShack.falseTagEvent) {
            ChromeShack.falseTagEvent = true;
            return; // avoid processing false-positive tag events
        } else if (ChromeShack.falseTagEvent) {
            ChromeShack.tagsLoadedHandler(item);
            ChromeShack.falseTagEvent = false;
        } */
        ChromeShack.tagsLoadedHandler(item);
    },

    processReply(parentId: string) {
        if (parentId) {
            const post: HTMLElement = document.querySelector(`li#item_${parentId} .sel.last`);
            const postId = post && post.id.substr(5);
            const root = post && post.closest(".root > ul > li");
            const rootId = root && root.id.substr(5);
            const is_root = !!elemMatches(post, ".root > ul > li");
            if (post && root) {
                // pass along our refreshed post and root post elements
                if (ChromeShack.debugEvents) console.log("raising processReplyEvent:", post, root);
                processReplyEvent.raise(post, root);
                // also raise the refresh intent event to alert listeners that we want to refresh (nuLOL fix)
                processRefreshIntentEvent.raise(postId, rootId, is_root, !!ChromeShack.isPostReplyMutation);
            }
        }
        ChromeShack.isPostReplyMutation = null;
    },
};

export default ChromeShack;
