let ChromeShack = {
    isPostRefreshMutation: null,

    isPostReplyMutation: null,

    install() {
        const observer_handler = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    //console.log(mutation);
                    try {
                        // track when mutations occur during a refresh or reply
                        if (mutation.target.matches("div.threads") &&
                            !!mutation.addedNodes[0] && !!mutation.removedNodes[0] &&
                            mutation.addedNodes[0].matches("div.threads div.root") &&
                            mutation.removedNodes[0].matches("div.root")) {
                                // save the root id of the refreshed thread
                                let target = mutation.addedNodes[0];
                                let rootId = target && target.id.substr(5);
                                ChromeShack.isPostRefreshMutation = rootId || null;
                        }
                        else if (ChromeShack.isPostRefreshMutation && mutation.target.matches("div.threads span.user")) {
                            // catch a refresh event (use refs relative to tag line)
                            let post = mutation.target.closest("li[id^='item_'].sel.last, li[id^='item_'].sel");
                            let root = post && post.closest(".root > ul > li");
                            if (post) ChromeShack.processRefresh(post, root);
                        }
                        else if (mutation.target.matches("li[id^='item_']") &&
                            mutation.previousSibling.matches(".fullpost") &&
                            mutation.removedNodes[0].matches("div.inlinereply")) {
                                // caught a reply event - save the parent post id
                                let parentId = mutation.target.id.substr(5);
                                ChromeShack.isPostReplyMutation = parentId || null;
                        }
                        // act on the saved reply mutation id from the previous mutation record
                        if (ChromeShack.isPostReplyMutation) {
                            let post = document.querySelector(`li#item_${ChromeShack.isPostReplyMutation} .last.sel`);
                            let root = post.closest("div.threads .root > ul > li");
                            ChromeShack.processReply(post, root);
                        }
                    } catch (err) { /* eat pre-processing exceptions */ }

                    for (let addedNode of mutation.addedNodes || []) {
                        try {
                            if (addedNode instanceof HTMLElement) {
                                if (addedNode.matches("div.threads .tag-counts")) {
                                    let post = addedNode.closest("li[id^='item_']");
                                    let root = post && post.closest(".root > ul > li");
                                    // catch tag data for fullpost
                                    let tagElems = [...post.querySelectorAll(".tag-container.non-zero[attr='data-tc'], .tag-container")];
                                    if (tagElems.length > 0 || tagElems.length === 7 || tagElems.length === 14) {
                                        // raise an event at the first sign that the backend is done with tag data
                                        ChromeShack.processTagDataLoaded(post, root);
                                    }
                                    // catch when a fullpost is refreshed by checking for tag data
                                    if (ChromeShack.isPostRefreshMutation) ChromeShack.processRefresh(post, root);
                                }
                                else if (addedNode.matches("div.threads .inlinereply")) {
                                    // user opened the inline reply panel
                                    ChromeShack.processPostBox(addedNode);
                                }
                                else if (addedNode.matches("div.threads .fullpost")) {
                                    // user opened an inline post
                                    ChromeShack.processPost(addedNode.parentNode, addedNode.parentNode.id.substr(5));
                                }
                            }
                        } catch (e) { console.log("A problem occurred when processing a post:", e); }
                    }
                }
            }
        };
        let observer = new MutationObserver(observer_handler);
        observer.observe(document, { characterData: true, subtree: true, childList: true });
        ChromeShack.processFullPosts();
    },

    processFullPosts() {
        let items = [...document.querySelectorAll("div.threads div.fullpost")];
        for (let item of items || [])
            ChromeShack.processPost(item.parentNode, item.parentNode.id.substr(5));

        fullPostsCompletedEvent.raise();
        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({ name: "chatViewFix" });
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({ name: "scrollByKeyFix" });
    },

    processPost(item, root_id) {
        let ul = item.parentNode;
        let div = ul.parentNode;
        let is_root_post = div.matches("div.threads .root");
        processPostEvent.raise(item, root_id, is_root_post);
    },

    processPostBox(postbox) {
        processPostBoxEvent.raise(postbox);
    },

    processReply(post, root) {
        if (post && root) processReplyEvent.raise(post, root);
        ChromeShack.isPostReplyMutation = null;
    },

    processRefresh(post, root, override) {
        if (post && root && override || post !== root)
            processRefreshEvent.raise(post, root, override);
        ChromeShack.isPostRefreshMutation = null;
    },

    processTagDataLoaded(post, root) {
        if (post && root) processTagDataLoadedEvent.raise(post, root);
    }
};

// make sure our async handlers are resolved before observing
Promise.all(deferredHandlers.map(async cb => await cb)).then(ChromeShack.install);
