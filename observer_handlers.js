let ChromeShack = {
    isPostReplyMutation: null,

    isPostRefreshMutation: null,

    listenForTagData: false,

    install() {
        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    try {
                        if (mutation.target.matches("div.threads") &&
                            mutation.addedNodes.length > 0 && mutation.removedNodes.length > 0 &&
                            mutation.addedNodes[0].matches("div.root") &&
                            mutation.removedNodes[0].matches("div.root")) {
                                // save the root id of the refreshed thread
                                let target = mutation.addedNodes[0];
                                ChromeShack.isPostRefreshMutation = target ? parseInt(target.id.substr(5)) : null;
                        }
                        else if (mutation.target.matches("span.user") && ChromeShack.isPostRefreshMutation) {
                            // use the stored root id to target the refreshed post item
                            let target = mutation.target.closest("li[id^='item_']");
                            ChromeShack.processRefresh({ target }, ChromeShack.isPostRefreshMutation);
                        }
                        else if (mutation.previousSibling && mutation.removedNodes &&
                            mutation.previousSibling.matches(".fullpost") &&
                            mutation.removedNodes[0].matches(".inlinereply")) {
                                // save the post id of the reply parent
                                let target = mutation.target.closest("li[id^='item_']");
                                ChromeShack.isPostReplyMutation = target ? parseInt(target.id.substr(5)) : null;
                        }
                        else if (ChromeShack.listenForTagData &&
                            mutation.target.matches("span.tag-container") &&
                            mutation.target.parentNode.childElementCount === 7) {
                                // raise an event when tag data looks like it's fully loaded
                                ChromeShack.processTagDataLoaded(mutation.target);
                        }
                    } catch (err) { /* eat exceptions here */ }

                    let added_nodes = mutation.addedNodes;
                    for (let addedNode of added_nodes || []) {
                        // wrap in a try/catch in case our element node is null
                        try {
                            let elem = addedNode.parentNode;
                            let source_id = elem && elem.id;
                            // starts with "root", they probably refreshed the thread
                            if (addedNode.classList && objContains("root", addedNode.classList))
                                ChromeShack.processFullPosts();
                            // starts with "item_", they probably clicked on a reply
                            if (source_id && source_id.indexOf("item_") === 0) {
                                // grab the id from the old node, since the new node doesn't contain the id
                                let id = source_id.substr(5);
                                ChromeShack.processPost(elem, id);
                            }
                            // the user posted a reply and the thread has refreshed
                            if (elem && ChromeShack.isPostReplyMutation)
                                ChromeShack.processReply(ChromeShack.isPostReplyMutation);

                            // check specifically for the postbox being added
                            let changed_id = addedNode && addedNode.id;
                            if (changed_id && changed_id === "postbox") ChromeShack.processPostBox(addedNode);
                        } catch (e) {
                            console.log("A problem occurred when processing a post:", e);
                        }
                    }
                }
            }
        };
        let observer = new MutationObserver(observer_handler);
        observer.observe(document, { characterData: true, subtree: true, childList: true });
        ChromeShack.processFullPosts();
        fullPostsCompletedEvent.addHandler(ChromeShack.processFullPostsCompleted);
    },

    processFullPosts() {
        // process fullposts
        let items = [...document.querySelectorAll("div.fullpost")];
        for (let item of items || []) {
            ChromeShack.processPost(item.parentNode, item.parentNode.id.substr(5));
        }
        fullPostsCompletedEvent.raise();

        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({ name: "chatViewFix" });
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({ name: "scrollByKeyFix" });
    },

    processFullPostsCompleted() {
        // avoid processing tag mutations until all fullposts have loaded
        ChromeShack.listenForTagData = true;
    },

    processPost(item, root_id) {
        let ul = item.parentNode;
        let div = ul.parentNode;
        let is_root_post = div.matches(".root");
        processPostEvent.raise(item, root_id, is_root_post);
    },

    processPostBox(postbox) {
        processPostBoxEvent.raise(postbox);
    },

    processReply(parentId) {
        let refreshedPost = parentId && document.querySelector(`li#item_${parentId} .sel.last`);
        if (refreshedPost) {
            let rootPost = refreshedPost.closest(".root");
            // pass along our refreshed post and root post elements
            processReplyEvent.raise(refreshedPost, rootPost);
        }
        ChromeShack.isPostReplyMutation = null;
    },

    processRefresh(e, rootId) {
        let refreshedPost = e.target && e.target.closest("li[id^='item_']");
        // if we're provided the root post id from an observer mutation - use it
        let rootPost = rootId ?
            document.querySelector(`#root_${rootId} > ul > li`) :
            e.target && e.target.closest(".root > ul > li");
        processRefreshEvent.raise(refreshedPost, rootPost);
        ChromeShack.isPostRefreshMutation = null;
    },

    processTagDataLoaded(item) {
        let post = item && item.closest("li[id^='item_']");
        let root = post && post.closest(".root > ul > li");
        processTagDataLoadedEvent.raise(post, root);
    },
};

// make sure our async handlers are resolved before observing
Promise.all(deferredHandlers.map(async cb => await cb)).then(ChromeShack.install);
