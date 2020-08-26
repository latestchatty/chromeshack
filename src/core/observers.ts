import { browser } from "webextension-polyfill-ts";

import {
    fullPostsCompletedEvent,
    processPostEvent,
    processPostBoxEvent,
    processPostRefreshEvent,
    processReplyEvent,
    processEmptyTagsLoadedEvent,
    processTagDataLoadedEvent,
    processRefreshIntentEvent,
} from "./events";
import { elemMatches, locatePostRefs } from "./common";
import { setSetting } from "./settings";
import { setUsername } from "./notifications";

interface TagUpdateMutation {
    [key: string]: HTMLElement;
}

const ChromeShack = {
    isTagUpdateMutation: {} as TagUpdateMutation,

    isPostReplyMutation: null as string,

    hasInitialized: false,

    debugEvents: false,

    install() {
        let username = document.getElementById("user_posts");
        setSetting("username", username ? username.innerText : ""); // fire and forget

        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = (mutationsList: MutationRecord[]) => {
            (async () => {
                // set our current logged-in username once upon refreshing the Chatty
                const loggedInUsername = document.getElementById("user_posts")?.innerText || "";
                if (loggedInUsername) await setUsername(loggedInUsername);
            })();

            try {
                //if (ChromeShack.debugEvents) console.log("mutation:", mutationsList);

                if (
                    mutationsList[0].type === "attributes" ||
                    mutationsList[mutationsList.length - 1].type === "attributes"
                ) {
                    const firstMutation = mutationsList[0]?.target as HTMLElement;
                    const lastMutation = mutationsList[mutationsList.length - 1]?.target as HTMLElement;

                    /* detect the nuLOL tag mutations after a user refreshes a post/rootpost */
                    const rootTagsLoaded =
                        mutationsList.length >= 7 && elemMatches(firstMutation, ".tag-container:not(.read-only)");
                    const postTagsLoaded =
                        mutationsList.length >= 7 && elemMatches(lastMutation, ".tag-container:not(.read-only)");
                    if (postTagsLoaded || rootTagsLoaded) {
                        const { post, postid, root, rootid, is_root } =
                            locatePostRefs(postTagsLoaded) || locatePostRefs(rootTagsLoaded) || {};
                        if (ChromeShack.isTagUpdateMutation[postid]) {
                            if (ChromeShack.debugEvents && postTagsLoaded)
                                console.log("post tags loaded:", postTagsLoaded);
                            else if (ChromeShack.debugEvents && rootTagsLoaded)
                                console.log("root tags loaded:", rootTagsLoaded);
                            ChromeShack.handleTagsEvent(post, root, postid, rootid, is_root);
                        } else if (post) ChromeShack.isTagUpdateMutation[postid] = post as HTMLElement;
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
                        if (ChromeShack.debugEvents)
                            console.log("post reply mutation?", lastMutatedSibling, lastRemoved, parentId);
                    }

                    for (const addedNode of mutation.addedNodes || []) {
                        const added = addedNode as HTMLElement;
                        const addedParent = addedNode?.parentNode as HTMLElement;
                        // the root post was swapped - they probably refreshed or replied to a thread
                        if (elemMatches(added, "div.root") && ChromeShack.isPostReplyMutation)
                            ChromeShack.handleReplyEvent(ChromeShack.isPostReplyMutation);
                        // check for opening a fullpost
                        if (elemMatches(addedParent, "li[id^='item_']")) {
                            // grab the id from the old node, since the new node doesn't contain the id
                            const { post, postid, root, rootid, is_root } = locatePostRefs(addedParent) || {};
                            // NOTE: we check for tags when loading every fullpost
                            ChromeShack.processPost(post, root, postid, rootid, is_root);
                        }
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

        processRefreshIntentEvent.addHandler(ChromeShack.handleRefreshIntent);
    },

    /*
     * Core DOM mutation events (chatty/post loading)
     */
    processFullPosts() {
        // process fullposts
        const items = [...document.querySelectorAll("div.fullpost")];
        for (const item of items || []) {
            const { post, postid, root, rootid, is_root } = locatePostRefs(item as HTMLElement) || {};
            if (post && rootid) ChromeShack.processPost(post, root, postid, rootid, is_root);
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
    processPost(post: HTMLElement, root: HTMLElement, postid: string, rootid: string, is_root: boolean) {
        if (ChromeShack.debugEvents) console.log("raising processPostEvent:", post, rootid, is_root);
        processPostEvent.raise(post, rootid, is_root);
        if (ChromeShack.hasInitialized) {
            // only detect tag mutations when manually loading fullposts/rootposts
            ChromeShack.isTagUpdateMutation[postid] = post;
            ChromeShack.handleTagsEvent(post, root, postid, rootid, is_root);
        }
    },
    processPostBox(postbox: HTMLElement) {
        if (ChromeShack.debugEvents) console.log("raising processPostBoxEvent:", postbox);
        if (postbox) processPostBoxEvent.raise(postbox);
    },

    /*
     * Post specific DOM mutation events (refresh button and nuLOL tags)
     */
    handleRefreshIntent(post: HTMLElement, root: HTMLElement, postid: string, rootid: string) {
        const refreshBtn = root?.querySelector(".refresh > a") as HTMLAnchorElement;
        if (refreshBtn) refreshBtn.click();
    },
    handleReplyEvent(parentId: string) {
        if (parentId) {
            const post = document.querySelector(`li#item_${parentId} .sel.last`) as HTMLElement;
            const root = post?.closest(".root > ul > li.sel") as HTMLElement;
            if (post && root) {
                // pass along our refreshed post and root post elements
                if (ChromeShack.debugEvents) console.log("raising processReplyEvent:", post, root);
                processReplyEvent.raise(post, root);
            }
        }
        ChromeShack.isPostReplyMutation = null;
    },
    handlePostRefreshEvent(
        post: HTMLElement,
        root: HTMLElement,
        postid: string,
        rootid: string,
        postTags: Element[],
        rootTags: Element[],
    ) {
        // should be raised after a post is populated with tag data
        if (post || root) {
            if (ChromeShack.debugEvents)
                console.log("raising processPostRefreshEvent:", post, root, postid, rootid, postTags, rootTags);
            processPostRefreshEvent.raise(post, root, postid, rootid, postTags, rootTags);
        }
        processTagDataLoadedEvent.removeHandler(ChromeShack.handlePostRefreshEvent);
    },

    handleTagsEvent(post: HTMLElement, root: HTMLElement, postid: string, rootid: string, is_root: boolean) {
        // count all the tags in this post and raise events based on whether they contain data
        const rootTags = is_root
            ? [...root?.querySelectorAll(".root > ul > li.sel > .fullpost > .postmeta .lol-tags .nonzero")]
            : [];
        const postTags = [...post?.querySelectorAll(".fullpost > .postmeta .lol-tags .nonzero")];
        if (post && postTags.length > 0) {
            if (ChromeShack.debugEvents)
                console.log("raising processTagDataLoadedEvent:", post, root, postTags, rootTags);
            processTagDataLoadedEvent.raise(post, root, postTags, rootTags);
        } else if (post) {
            if (ChromeShack.debugEvents)
                console.log("raising processEmptyTagsLoadedEvent:", post, root, postTags, rootTags);
            processEmptyTagsLoadedEvent.raise(post, root, postTags, rootTags);
        }
        ChromeShack.handlePostRefreshEvent(post, root, postid, rootid, postTags, rootTags);
        delete ChromeShack.isTagUpdateMutation[postid];
    },
};

export default ChromeShack;
