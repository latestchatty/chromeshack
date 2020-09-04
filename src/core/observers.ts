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
import { elemMatches, locatePostRefs, arrHas } from "./common";
import { setSetting } from "./settings";
import { setUsername } from "./notifications";

export interface DOMMutationDict {
    [key: string]: HTMLElement;
}

const ChromeShack = {
    isTagUpdateMutation: {} as DOMMutationDict,
    isRefreshMutation: {} as DOMMutationDict,

    isPostReplyMutation: null as string,

    hasInitialized: false,

    debugEvents: false,

    install() {
        const username = document.getElementById("user_posts");
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

                // try to detect nuLOL tag mutations when the page loads a fullpost
                for (let i = mutationsList.length - 1; mutationsList.length > i && i !== -1; i--) {
                    // a tag mutation list comes in oldest to newest so go in reverse
                    const mutation = mutationsList[i];
                    const target = mutation?.target as HTMLElement;
                    const lastAdded = mutation?.addedNodes[mutation?.addedNodes?.length - 1] as HTMLElement;
                    if (
                        mutation?.type === "childList" &&
                        elemMatches(lastAdded, "span.tag-counts") &&
                        elemMatches(target, "span.user")
                    ) {
                        // try to catch when tags are loaded without data
                        const { post, postid, root, rootid, is_root } = locatePostRefs(target) || {};
                        return ChromeShack.handleTagsEvent(post, root, postid, rootid, is_root);
                    } else if (
                        mutation?.type === "childList" &&
                        elemMatches(target, "span.tag-container:not(.read-only)")
                    ) {
                        // try to catch when the tags are done loading (if they have data)
                        const { post, postid, root, rootid, is_root } = locatePostRefs(target) || {};
                        return ChromeShack.handleTagsEvent(post, root, postid, rootid, is_root);
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

        document.addEventListener("click", (e: MouseEvent) => {
            const _this = e?.target as HTMLElement;
            const refreshBtn = elemMatches(_this, ".fullpost .refresh > a");
            if (refreshBtn) {
                const { post, postid, root, rootid, is_root } = locatePostRefs(refreshBtn);
                // tag this post as "refreshing" so can raise an event for it later
                if (!ChromeShack.isRefreshMutation[postid]) ChromeShack.isRefreshMutation[postid] = post;
                ChromeShack.handleRefreshIntent(post, root, postid, rootid, is_root);
            }
        });
    },

    /*
     * Core DOM mutation events (chatty/post loading)
     */
    processFullPosts() {
        // process fullposts
        const items = [...document.querySelectorAll("div.fullpost")] as HTMLElement[];
        for (const item of items || []) {
            const { post, postid, root, rootid, is_root } = locatePostRefs(item) || {};
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
        // only detect tag mutations when manually loading/reloading fullposts
        if (ChromeShack.hasInitialized && !is_root) {
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
    handleRefreshIntent(post: HTMLElement, root: HTMLElement, postid: string, rootid: string, is_root: boolean) {
        if (ChromeShack.debugEvents)
            console.log("raising processRefreshIntentEvent:", post, root, postid, rootid, is_root);
        processRefreshIntentEvent.raise(post, root, postid, rootid, is_root);
    },
    handlePostRefreshEvent(post: HTMLElement, root: HTMLElement, postid: string, rootid: string, is_root: boolean) {
        // should be raised after a post is populated with tag data
        if (post || root) {
            if (ChromeShack.debugEvents)
                console.log("raising processPostRefreshEvent:", post, root, postid, rootid, is_root);
            processPostRefreshEvent.raise(post, root, postid, rootid, is_root);
        }
        delete ChromeShack.isRefreshMutation[postid];
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

    handleTagsEvent(post: HTMLElement, root: HTMLElement, postid: string, rootid: string, is_root: boolean) {
        // count all the tags in this post and raise events based on whether they contain data
        const rootTags = [
            ...root?.querySelectorAll(".root > ul > li.sel > .fullpost > .postmeta .lol-tags > .tag-container"),
        ];
        const rootTagsWithData = arrHas(rootTags)
            ? rootTags.reduce((acc, t: HTMLSpanElement) => {
                  const withData = elemMatches(t, ".nonzero");
                  if (withData) acc.push(withData);
                  return acc;
              }, [])
            : [];
        const postTags = [...post?.querySelectorAll(".fullpost > .postmeta .lol-tags > .tag-container")];
        const postTagsWithData = arrHas(postTags)
            ? postTags.reduce((acc, t: HTMLSpanElement) => {
                  const withData = elemMatches(t, ".nonzero");
                  if (withData) acc.push(withData);
                  return acc;
              }, [])
            : [];
        if (post && postTagsWithData.length > 0) {
            // NOTE: processTagDataLoadedEvent will fire *after* processPostRefreshEvent
            if (ChromeShack.debugEvents)
                console.log("raising processTagDataLoadedEvent:", post, root, postTagsWithData, rootTagsWithData);
            processTagDataLoadedEvent.raise(post, root, postTagsWithData, rootTagsWithData, is_root);
        } else if (post && postTags.length > 0) {
            if (ChromeShack.debugEvents) console.log("raising processEmptyTagsLoadedEvent:", post, root);
            processEmptyTagsLoadedEvent.raise(post, root, postid, rootid, is_root);
        }
        // NOTE: caution! processPostRefreshEvent will fire off *before* processTagDataLoadedEvent
        if (ChromeShack.isRefreshMutation[postid])
            ChromeShack.handlePostRefreshEvent(post, root, postid, rootid, is_root);
        delete ChromeShack.isTagUpdateMutation[postid];
    },
};

export default ChromeShack;
