import { browser } from "webextension-polyfill-ts";

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
import { setUsername } from "./notifications";

interface PostRefreshMutation {
    lastPostId?: string;
    lastRootId?: string;
    is_root?: boolean;
    from_reply?: boolean;
}
interface RefreshedThread {
    [key: string]: PostRefreshMutation;
}
interface TagUpdateMutation {
    [key: string]: HTMLElement;
}

const ChromeShack = {
    refreshingThreads: {} as RefreshedThread,

    isTagUpdateMutation: {} as TagUpdateMutation,

    isPostReplyMutation: null as string,

    hasInitialized: false,

    debugEvents: true,

    install() {
        let username = document.getElementById("user_posts");
        setSetting("username", username && username.innerText || ""); // fire and forget

        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = (mutationsList: MutationRecord[]) => {
            (async () => {
                // set our current logged-in username once upon refreshing the Chatty
                const loggedInUsername = document.getElementById("user_posts")?.innerText || "";
                if (loggedInUsername) await setUsername(loggedInUsername);
            })();

            try {
                const attrMutated = mutationsList[0].target as HTMLElement;
                if (mutationsList[0].type === "attributes" && elemMatches(attrMutated, ".tag-container, .lol-tags")) {
                    const lastMutation = mutationsList[mutationsList.length - 1].target as HTMLElement;
                    const mutatedPost: HTMLElement = lastMutation.closest("li.sel");

                    const isPost = lastMutation?.matches("li.sel .tag-container");
                    const isTagMutation = lastMutation?.matches("li.sel .lol-tags :not(.read-only)");
                    const postid = mutatedPost.id.substr(5);

                    // only process unique fullpost tag mutation and fullpost mutation events
                    if (ChromeShack.debugEvents) {
                        console.log(
                            "mutated:",
                            lastMutation,
                            mutatedPost,
                            isPost,
                            isTagMutation,
                            !!ChromeShack.isTagUpdateMutation[postid],
                        );
                    }
                    if (mutatedPost !== ChromeShack.isTagUpdateMutation[postid] && (isPost || isTagMutation)) {
                        ChromeShack.isTagUpdateMutation[postid] = mutatedPost;
                        return ChromeShack.processTagsLoaded(mutatedPost);
                    }
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
                        const addedTagMutation =
                            elemMatches(added, ".tag-counts, .user") && (added?.closest("li.sel") as HTMLElement);
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
                        if (addedTagMutation) ChromeShack.processTagsLoaded(addedTagMutation);
                        // check for the postbox
                        if (elemMatches(added, "#postbox")) ChromeShack.processPostBox(added);
                    }
                }
            } catch (e) {
                console.error("A problem occurred when processing a post:", e);
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
        const this_node = e?.target as HTMLElement;
        const clickedElem = this_node.matches("div.refresh > a") ? this_node : null;
        if (!clickedElem) return;

        const relPost = (clickedElem ? clickedElem?.closest("li.sel") : null) as HTMLElement;
        const postIsRoot = relPost?.matches(".root > ul > li");
        const relRoot = (postIsRoot ? relPost : clickedElem?.closest(".root > ul > li")) as HTMLElement;
        const rootContainer = (relRoot ? relRoot?.closest("div.root") : null) as HTMLElement;
        const postid = relPost?.id?.substr(5);
        const rootid = relRoot?.id?.substr(5);

        // check the NuLOLFix refresh list to make sure we don't reprocess the thread
        if (!ChromeShack.refreshingThreads[postid] && !elemMatches(rootContainer, ".refreshing")) {
            e.preventDefault();
            rootContainer?.closest("div.root")?.classList?.add("refreshing");
            if (ChromeShack.debugEvents) console.log("raising processRefreshIntentEvent:", postid, rootid, postIsRoot);
            processRefreshIntentEvent.raise(postid, rootid, postIsRoot, !!ChromeShack.isPostReplyMutation);
            return false;
        }
    },

    refreshIntentHandler(lastPostId: string, lastRootId: string, is_root: boolean, from_reply: boolean) {
        // keep track of what's being refreshed (only act if we pass through a second time)
        if (!ChromeShack.refreshingThreads[lastRootId])
            ChromeShack.refreshingThreads[lastRootId] = { lastPostId, lastRootId, is_root, from_reply };
        else {
            if (ChromeShack.debugEvents)
                console.log("refreshIntentHandler:", ChromeShack.refreshingThreads[lastRootId]);
            // listen for when tag data gets mutated (avoid duplicates!)
            processEmptyTagsLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
            processTagDataLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
        }
    },

    postRefreshHandler(post: HTMLElement, root: HTMLElement, postHasTags: boolean, rootHasTags: boolean) {
        // should be raised after a post is populated with tag data
        const rootId = root?.id?.substr(5);
        const { lastPostId: postid } = ChromeShack.refreshingThreads[rootId] || {};
        const _post: HTMLElement = (postid && document.querySelector(`li#item_${postid}`)) || post;
        if (_post || root) {
            if (ChromeShack.debugEvents)
                console.log("raising processPostRefreshEvent:", _post, root, postHasTags, rootHasTags);
            processPostRefreshEvent.raise(_post, root, postHasTags, rootHasTags);
            delete ChromeShack.refreshingThreads[rootId];
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

        (async () => {
            // catch and eat errors here because this is harmless in this context:
            // https://github.com/mozilla/webextension-polyfill/issues/130
            // monkey patch the 'clickItem()' method on Chatty once we're done loading
            await browser.runtime.sendMessage({ name: "chatViewFix" }).catch(console.log);
            // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
            await browser.runtime.sendMessage({ name: "scrollByKeyFix" }).catch(console.log);
        })();
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
        const post = item?.closest("li.sel");
        const root = post?.closest(".root > ul > li");
        const postid = post.id.substr(5);
        const rootTags =
            post !== root
                ? [...root?.querySelectorAll(".root > ul > li.sel > .fullpost > .postmeta .lol-tags .nonzero")]
                : [];
        const postTags = [...post?.querySelectorAll(".fullpost > .postmeta .lol-tags .nonzero")];
        if (post && postTags.length > 0 && ChromeShack.isTagUpdateMutation[postid]) {
            if (ChromeShack.debugEvents)
                console.log("raising processTagDataLoadedEvent:", post, root, postTags, rootTags);
            processTagDataLoadedEvent.raise(post, root, postTags, rootTags);
            delete ChromeShack.isTagUpdateMutation[postid];
        } else if (post && ChromeShack.isTagUpdateMutation[postid]) {
            if (ChromeShack.debugEvents)
                console.log("raising processEmptyTagsLoadedEvent:", post, root, postTags, rootTags);
            processEmptyTagsLoadedEvent.raise(post, root, postTags, rootTags);
            delete ChromeShack.isTagUpdateMutation[postid];
        }
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
