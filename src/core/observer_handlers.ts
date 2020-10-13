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

export const handlePostRefresh = (args: PostEventArgs) => processPostRefreshEvent.raise(args);

export const handleRootAdded = (args: RefreshMutation) => {
    const { postid, rootid, parentid } = args || {};
    const root = document.querySelector(`li#item_${rootid}`);
    const post = document.querySelector(`li#item_${postid || parentid}`);
    const reply = parentid && post?.querySelector("li.sel.last");
    const raisedArgs = { post: reply || post, postid: parentid || postid, root, rootid } as PostEventArgs;
    if (reply && root) processReplyEvent.raise(raisedArgs);
    else if (post && root) {
        processRefreshIntentEvent.raise(raisedArgs);
        handleTagsEvent(raisedArgs).then(handlePostRefresh).catch(handlePostRefresh);
    }
};

export const handleRefreshClick = (e: MouseEvent) => {
    const _this = e?.target as HTMLElement;
    const refreshBtn = elemMatches(_this, ".fullpost .refresh > a");
    if (refreshBtn) {
        const { postid, rootid } = locatePostRefs(refreshBtn);
        ChromeShack.refreshing.unshift({ postid, rootid });
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
