/*
 *  Attempt to workaround Chatty's nuLOL API data not loading after replying/refreshing posts
 */

const NuLOLFix = {
    install() {
        // intercept intent events (refresh/reply) that include the post and root ids
        processRefreshIntentEvent.addHandler(NuLOLFix.preRefreshHandler);
        // intercept the event that fires after tag data has loaded
        processPostRefreshEvent.addHandler(NuLOLFix.postRefreshHandler);
    },

    preRefreshHandler(postId, rootId) {
        // click the root refresh to refresh tag data for the whole thread
        let _postId = postId && typeof postId !== "string" ? postId.id.substr(5) : postId;
        let _rootId = rootId && typeof rootId !== "string" ? rootId.id.substr(5) : rootId;
        let root = document.querySelector(`#root_${_rootId} > ul > li`);
        let rootRefreshBtn = root && root.querySelector(".refresh > a");
        let matched = ChromeShack.refreshingThreads[_rootId];
        // don't rerun this if we're already refreshing
        if (rootRefreshBtn && !matched) {
            console.log("attempting to refresh the thread tag data:", root);
            matched = {postId: _postId, rootId: _rootId};
            rootRefreshBtn.click();
        }
    },

    postRefreshHandler(post, root) {
        // reopen the saved post
        let rootId = root && root.id.substr(5);
        let oneline = post && post.querySelector(".oneline_body");
        let matched = ChromeShack.refreshingThreads[rootId];
        if (matched) {
            if (oneline) {
                console.log("attempting to reopen the last open post:", post, root, matched);
                oneline.click();
            }
            // raise the processPost event on the root post so listeners are notified
            processPostEvent.raise(root);
        }
    }
};

fullPostsCompletedEvent.addHandler(NuLOLFix.install);
