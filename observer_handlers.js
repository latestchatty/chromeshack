let ChromeShack = {
    isPostReplyMutation: false,

    install() {
        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    try {
                        if (mutation.previousSibling && mutation.removedNodes &&
                            mutation.previousSibling.matches(".fullpost") &&
                            mutation.removedNodes[0].matches(".inlinereply"))
                            ChromeShack.isPostReplyMutation = true;
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
                            if (elem && elem.matches("div.threads") && ChromeShack.isPostReplyMutation)
                                ChromeShack.replyFixHandler(elem); // fix busted nuLOL API loading

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
        processPostEvent.raise(item, root_id, is_root_post);
    },

    processPostBox(postbox) {
        processPostBoxEvent.raise(postbox);
    },

    replyFixHandler(threadElem) {
        let newPostRefreshBtn = threadElem.querySelector("li li.sel.last .fullpost .refresh > a");
        processReplyEvent.raise(newPostRefreshBtn.closest("li .fullpost"));
        // target the last selected child to find the newest reply
        if (newPostRefreshBtn) newPostRefreshBtn.click();
        else console.log("Something went wrong with the nuLOL reply fix!");
        ChromeShack.isPostReplyMutation = false; // unflag when done with handling
    },
};

// make sure our async handlers are resolved before observing
Promise.all(deferredHandlers.map(async cb => await cb)).then(ChromeShack.install);
