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
import { elementMatches, locatePostRefs } from "./common";

// provide an interface with optional properties
interface PostRefreshMutation {
    lastPostId?: number | string;
    lastRootId?: number | string;
    is_root?: boolean;
    from_reply?: boolean;
}

const ChromeShack = {
    refreshingThreads: {},

    isPostRefreshMutation: <PostRefreshMutation>{},

    isPostReplyMutation: null,

    hasInitialized: false,

    falseTagEvent: false,

    debugEvents: false,

    install() {
        let username = document.getElementById("user_posts");
        setSetting("username", username && username.innerText || ""); // fire and forget

        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = (mutationsList: MutationRecord[]) => {
            try {
                if (
                    mutationsList[0].type === "attributes" &&
                    elementMatches(mutationsList[0].target as Element, ".tag-container, .lol-tags")
                ) {
                    const lastMutation = (mutationsList[mutationsList.length - 1].target as Element).closest(
                        "li[id^='item_']",
                    );
                    if (lastMutation) return ChromeShack.processTagsLoaded(lastMutation);
                }
                for (const mutation of mutationsList) {
                    //if (ChromeShack.ChromeShack.debugEvents && mutation.type !== "attributes") console.log(mutation);
                    // flag indicated the user has triggered a fullpost reply
                    if (
                        elementMatches(mutation.previousSibling as Element, ".fullpost") &&
                        elementMatches(mutation.removedNodes[0] as Element, ".inlinereply")
                    ) {
                        const target = (mutation.target as Element).closest("li[id^='item_']");
                        const parentId = target && parseInt(target.id.substr(5));
                        ChromeShack.isPostReplyMutation = parentId || null;
                    }

                    for (const addedNode of mutation.addedNodes || []) {
                        const _added = addedNode as Element;
                        const _addedParent = addedNode.parentNode as Element;
                        // the root post was swapped - they probably refreshed or replied to a thread
                        if (elementMatches(_added, "div.root") && ChromeShack.isPostReplyMutation)
                            ChromeShack.processReply(ChromeShack.isPostReplyMutation);

                        // check for opening a fullpost
                        if (elementMatches(_addedParent, "li[id^='item_']")) {
                            // grab the id from the old node, since the new node doesn't contain the id
                            ChromeShack.processPost(_addedParent, _addedParent.id.substr(5));
                        }
                        // check for tags loading after a fullpost
                        if (elementMatches(_addedParent, "span.user")) ChromeShack.tagsLoadedHandler(_added);

                        // check for the postbox
                        if (elementMatches(_added, "#postbox")) ChromeShack.processPostBox(_added);
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
        const clickedElem = elementMatches(e.target as HTMLLinkElement, "div.refresh > a");
        const root = clickedElem && clickedElem.closest(".root > ul > li");
        const rootId = root && root.id.substr(5);
        // check the NuLOLFix refresh list to make sure we don't reprocess the thread
        if (clickedElem && !ChromeShack.refreshingThreads[rootId] && !elementMatches(root, ".refreshing")) {
            const nearestPost = clickedElem.closest("li[id^='item_']");
            const is_root = nearestPost && (nearestPost.parentNode.parentNode as HTMLDivElement).matches(".root");
            const openPostId = !is_root && nearestPost && nearestPost.id.substr(5);
            const root = clickedElem.closest(".root > ul > li");
            const rootId = root && root.id.substr(5);
            root.classList.add("refreshing");
            if (ChromeShack.debugEvents) console.log("raising processRefreshIntentEvent:", openPostId, rootId, is_root);
            processRefreshIntentEvent.raise(openPostId, rootId, is_root, !!ChromeShack.isPostReplyMutation);
        }
    },

    refreshIntentHandler(
        lastPostId: number | string,
        lastRootId: number | string,
        is_root: boolean,
        from_reply: boolean,
    ) {
        // make sure to save the ids of the open posts so we can reopen them later
        ChromeShack.isPostRefreshMutation = {
            lastPostId,
            lastRootId,
            is_root,
            from_reply,
        };
        // keep track of what's being refreshed
        ChromeShack.refreshingThreads[lastRootId] = ChromeShack.isPostRefreshMutation;
        // listen for when tag data gets mutated (avoid duplicates!)
        processEmptyTagsLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
        processTagDataLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
    },

    postRefreshHandler(post: Element, root: Element, postHasTags: boolean, rootHasTags: boolean) {
        // should be raised after a post is populated with tag data
        processEmptyTagsLoadedEvent.removeHandler(ChromeShack.postRefreshHandler);
        processTagDataLoadedEvent.removeHandler(ChromeShack.postRefreshHandler);
        const rootId = root && root.id.substr(5);
        if (ChromeShack.debugEvents)
            console.log("raising processPostRefreshEvent:", post, root, postHasTags, rootHasTags);
        if (!post) {
            // if we're called from a reply handler that can't pass a postId then find it ourselves
            if (ChromeShack.isPostRefreshMutation && ChromeShack.isPostRefreshMutation.lastPostId) {
                post =
                    ChromeShack.isPostRefreshMutation.lastPostId &&
                    document.querySelector(`li#item_${ChromeShack.isPostRefreshMutation.lastPostId}`);
            }
        }
        if (post || root) processPostRefreshEvent.raise(post, root, postHasTags, rootHasTags);
        // since we're done refreshing remove this thread from our tracking list
        delete ChromeShack.refreshingThreads[rootId];
        ChromeShack.isPostRefreshMutation = {};
    },

    tagsLoadedHandler(item: Element) {
        const { post, root } = locatePostRefs(item);
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
        for (const item of items || [])
            ChromeShack.processPost(item.parentNode as HTMLDivElement, (<HTMLElement>item.parentNode).id.substr(5));
        if (ChromeShack.debugEvents) console.log("raising fullPostsCompletedEvent");
        fullPostsCompletedEvent.raise();
        ChromeShack.hasInitialized = true;

        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({ name: "chatViewFix" });
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({ name: "scrollByKeyFix" });
    },

    processPost(item: Element, root_id: number | string) {
        const post = elementMatches(item, "li[id^='item_']") || item.closest("li[id^='item_']");
        const is_root_post = !!elementMatches(post, ".root > ul > li");
        if (ChromeShack.debugEvents) console.log("raising processPostEvent:", post, root_id, is_root_post);
        processPostEvent.raise(post, root_id, is_root_post);
    },

    processPostBox(postbox: Element) {
        if (ChromeShack.debugEvents) console.log("raising processPostBoxEvent:", postbox);
        if (postbox) processPostBoxEvent.raise(postbox);
    },

    processTagsLoaded(item: Element) {
        if (!ChromeShack.falseTagEvent) {
            ChromeShack.falseTagEvent = true;
            return; // avoid processing false-positive tag events
        } else if (ChromeShack.falseTagEvent) {
            ChromeShack.tagsLoadedHandler(item);
            ChromeShack.falseTagEvent = false;
        }
    },

    processReply(parentId: number | string) {
        if (parentId) {
            const post = document.querySelector(`li#item_${parentId} .sel.last`);
            const postId = post && post.id.substr(5);
            const root = post && post.closest(".root > ul > li");
            const rootId = root && root.id.substr(5);
            const is_root = !!elementMatches(post, ".root > ul > li");
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
