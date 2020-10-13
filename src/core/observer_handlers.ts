import { browser } from "webextension-polyfill-ts";
import { arrHas, elemMatches, locatePostRefs } from "./common";
import {
    fullPostsCompletedEvent,
    processEmptyTagsLoadedEvent,
    processPostBoxEvent,
    processPostEvent,
    processPostRefreshEvent,
    processRefreshIntentEvent,
    processReplyEvent,
    processTagDataLoadedEvent,
} from "./events";
import type { PostEventArgs, RefreshMutation } from "./index.d";
import { ChromeShack } from "./observer";

const asyncResolveTags = (post: HTMLElement, timeout?: number) => {
    const collectTagData = (post: HTMLElement) => {
        const postTags = [
            ...post?.querySelectorAll(".fullpost > .postmeta .lol-tags > .tag-container"),
        ] as HTMLElement[];
        const postTagsWithData = arrHas(postTags)
            ? postTags.reduce((acc, t: HTMLSpanElement) => {
                  const withData = elemMatches(t, ".nonzero");
                  if (withData) acc.push(withData);
                  return acc;
              }, [] as HTMLElement[])
            : [];
        return arrHas(postTagsWithData) ? postTagsWithData : null;
    };

    const _timeout = timeout || 1000; // 1s timeout by default
    const intervalStep = 100; // 100ms
    return new Promise((resolve, reject) => {
        let tagsTimer = 0;
        if (!post) return reject(null);
        const tagsInterval = setInterval(() => {
            // check every timeStep for data being loaded up to a timeout
            const tagCheckResult = collectTagData(post);
            if (tagsTimer <= _timeout && arrHas(tagCheckResult)) {
                clearInterval(tagsInterval);
                return resolve(tagCheckResult);
            } else if (tagsTimer > _timeout) {
                clearInterval(tagsInterval);
                return reject(null);
            }
            tagsTimer += intervalStep;
        }, intervalStep);
    });
};
export const handleTagsEvent = (args: PostEventArgs) => {
    const { post } = args || {};
    // count all the tags in this post and raise events based on whether they contain data
    return asyncResolveTags(post)
        .then((tagData: HTMLElement[]) => {
            const _args = { ...args, tagData };
            processTagDataLoadedEvent.raise(_args);
            return _args;
        })
        .catch((emptyTags: HTMLElement[]) => {
            const _args = { ...args, emptyTags };
            processEmptyTagsLoadedEvent.raise(_args);
            return _args;
        });
};

export const handlePostRefresh = (args: PostEventArgs, mutation?: RefreshMutation) => {
    const { post, root, postid, rootid } = args || {};
    const postOL = post?.querySelector(".oneline_body") as HTMLElement;
    const replyOL = root?.querySelector(`li#item_${mutation.postid} .oneline_body`) as HTMLElement;
    processPostRefreshEvent.raise(args, mutation);
    // reopen the previously open post (if applicable)
    if (postid !== rootid && postOL) postOL.click();
    else if (postid !== rootid && replyOL) replyOL.click();
    // clean up after ourselves
    ChromeShack.refreshing = [...ChromeShack.refreshing.filter((r) => r.rootid !== args.rootid)];
};

export const handleRootAdded = (mutation: RefreshMutation) => {
    const { postid, rootid, parentid } = mutation || {};
    const root = document.querySelector(`li#item_${rootid}`);
    const post = document.querySelector(`li#item_${postid || parentid}`);
    const reply = parentid && post?.querySelector("li.sel.last");
    const raisedArgs = { post: reply || post, postid: parentid || postid, root, rootid } as PostEventArgs;
    if (reply && root) processReplyEvent.raise(raisedArgs, mutation);
    else if (post && root) {
        processRefreshIntentEvent.raise(raisedArgs);
        handleTagsEvent(raisedArgs)
            .then((neArgs) => handlePostRefresh(neArgs, mutation))
            .catch((eArgs) => handlePostRefresh(eArgs, mutation));
    }
};

export const handleReplyAdded = (args: PostEventArgs) => {
    const { post } = args || {};
    console.log("handleReplyAdded:", args);
    const postRefreshBtn = post?.querySelector("div.refresh > a") as HTMLElement;
    ChromeShack.refreshing = [...ChromeShack.refreshing.filter((r) => r.rootid !== args.rootid)];
    if (postRefreshBtn) postRefreshBtn.click();
};

export const handleRefreshClick = (e: MouseEvent) => {
    const _this = e?.target as HTMLElement;
    const refreshBtn = elemMatches(_this, "div.refresh > a");
    if (refreshBtn) {
        const { root, postid, rootid, is_root } = locatePostRefs(refreshBtn);
        const rootRefreshBtn = root?.querySelector("div.refresh > a") as HTMLElement;
        const foundIdx = ChromeShack.refreshing.findIndex((r) => r.rootid === rootid);
        if (foundIdx === -1) ChromeShack.refreshing.unshift({ postid, rootid });
        // avoid unnecessary tag refreshes by refreshing the root only
        if (!is_root) {
            e.preventDefault();
            rootRefreshBtn.click();
        }
    }
};

export const processObserverInstalled = async () => {
    // monkey patch the 'clickItem()' method on Chatty once we're done loading
    await browser.runtime.sendMessage({ name: "chatViewFix" }).catch(console.log);
    // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
    await browser.runtime.sendMessage({ name: "scrollByKeyFix" }).catch(console.log);
};

export const processPost = (args: PostEventArgs) => {
    processPostEvent.raise(args);
    handleTagsEvent(args);
};
export const processFullPosts = () => {
    const fullposts = document.getElementsByClassName("fullpost");
    for (let i = fullposts.length - 1; i >= 0; i--) {
        const node = fullposts[i] as HTMLElement;
        const args = locatePostRefs(node);
        const { post, root } = args || {};
        if (root || post) processPost(args);
    }
    fullPostsCompletedEvent.raise();
};
export const processPostBox = (postbox: HTMLElement) => {
    if (postbox) processPostBoxEvent.raise(postbox);
};
