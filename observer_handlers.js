let ChromeShack = {
    isPostReplyMutation: null,

    install() {
        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    try {
                        // flag indicated the user has triggered a fullpost reply
                        if (mutation.previousSibling && mutation.removedNodes &&
                            mutation.previousSibling.matches(".fullpost") &&
                            mutation.removedNodes[0].matches(".inlinereply")) {
                            let target = mutation.target.closest("li[id^='item_']");
                            let parentId = target && parseInt(target.id.substr(5));
                            ChromeShack.isPostReplyMutation = parentId || null;
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

    processPost(item, root_id) {
        let ul = item.parentNode;
        let div = ul.parentNode;
        let is_root_post = div.className.indexOf("root") >= 0;

        // feed the refresh-post event handler for each post
        let refreshBtns = [...document.querySelectorAll("div.refresh a, a.closepost, a.showpost:not(.hidden)")];
        for (let btn of refreshBtns || []) {
            btn.removeEventListener("click", ChromeShack.processRefresh);
            btn.addEventListener("click", ChromeShack.processRefresh);
        }

        processPostEvent.raise(item, root_id, is_root_post);
    },

    processPostBox(postbox) {
        processPostBoxEvent.raise(postbox);
    },

    processReply(parentId) {
        if (parentId) {
            let refreshedPost = document.querySelector(`li#item_${parentId} .sel.last`);
            if (refreshedPost) {
                let rootPost = refreshedPost.closest(".root");
                // pass along our refreshed post and root post elements
                processReplyEvent.raise(refreshedPost, rootPost);
            }
        }
        ChromeShack.isPostReplyMutation = null;
    },

    processRefresh(e) {
        let refreshed = e.target.closest("li[id^='item_']");
        let refreshedId = refreshed.id.substr(5);
        let root = e.target.closest(".root > ul > li");
        let rootId = root.id.substr(5);
        let refreshFrame = document.getElementById("dom_iframe");
        const loadHandler = () => {
            let refreshedPost = document.getElementById(`item_${refreshedId}`);
            let rootPost = document.getElementById(`root_${rootId}`);
            processRefreshEvent.raise(refreshedPost, rootPost);
            refreshFrame.removeEventListener("load", loadHandler);
        };
        refreshFrame.removeEventListener("load", loadHandler);
        refreshFrame.addEventListener("load", loadHandler);
    }
};

// make sure our async handlers are resolved before observing
Promise.all(deferredHandlers.map(async cb => await cb)).then(ChromeShack.install);
