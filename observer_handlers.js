let ChromeShack = {
    refreshingThreads: {},

    isPostRefreshMutation: {},

    isPostReplyMutation: null,

    hasInitialized: false,

    falseTagEvent: false,

    debugEvents: false,

    install() {
        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = (mutationsList) => {
            try {
                if (
                    mutationsList[0].type === "attributes" &&
                    elementMatches(mutationsList[0].target, ".tag-container, .lol-tags")
                ) {
                    let lastMutation = mutationsList[mutationsList.length - 1].target.closest("li[id^='item_']");
                    if (lastMutation) return ChromeShack.processTagsLoaded(lastMutation);
                }
                for (let mutation of mutationsList) {
                    //if (ChromeShack.debugEvents && mutation.type !== "attributes") console.log(mutation);
                    // flag indicated the user has triggered a fullpost reply
                    if (
                        elementMatches(mutation.previousSibling, ".fullpost") &&
                        elementMatches(mutation.removedNodes[0], ".inlinereply")
                    ) {
                        let target = mutation.target.closest("li[id^='item_']");
                        let parentId = target && parseInt(target.id.substr(5));
                        ChromeShack.isPostReplyMutation = parentId || null;
                    }

                    for (let addedNode of mutation.addedNodes || []) {
                        // the root post was swapped - they probably refreshed or replied to a thread
                        if (elementMatches(addedNode, "div.root") && ChromeShack.isPostReplyMutation) {
                            ChromeShack.processReply(ChromeShack.isPostReplyMutation);
                        }
                        // check for opening a fullpost
                        if (elementMatches(addedNode.parentNode, "li[id^='item_']")) {
                            // grab the id from the old node, since the new node doesn't contain the id
                            ChromeShack.processPost(addedNode.parentNode, addedNode.parentNode.id.substr(5));
                        }
                        // check for the postbox
                        if (elementMatches(addedNode, "#postbox")) ChromeShack.processPostBox(addedNode);
                    }
                }
            } catch (e) {
                console.log("A problem occurred when processing a post:", e);
            }
        };
        let observer = new MutationObserver(observer_handler);
        observer.observe(document, {
            characterData: true,
            subtree: true,
            attributeFilter: ["data-tc", "data-uc"],
            childList: true
        });

        ChromeShack.processFullPosts();

        // subscribe to refresh button clicks so we can pass along the open post ids
        document.addEventListener("click", ChromeShack.refreshHandler);
        // subscribe to processRefreshIntentEvent to enable passing post and root refs around
        processRefreshIntentEvent.addHandler(ChromeShack.refreshIntentHandler);
    },

    refreshHandler(e) {
        let clickedElem = elementMatches(e.target, "div.refresh > a");
        let root = clickedElem && clickedElem.closest(".root > ul > li");
        let rootId = root && root.id.substr(5);
        // check the NuLOLFix refresh list to make sure we don't reprocess the thread
        if (clickedElem && !ChromeShack.refreshingThreads[rootId] && !elementMatches(root, ".refreshing")) {
            let nearestPost = clickedElem.closest("li[id^='item_']");
            let is_root = nearestPost && nearestPost.parentNode.parentNode.matches(".root");
            let openPostId = !is_root && nearestPost && nearestPost.id.substr(5);
            let root = clickedElem.closest(".root > ul > li");
            let rootId = root && root.id.substr(5);
            root.classList.add("refreshing");
            if (ChromeShack.debugEvents) console.log("raising processRefreshIntentEvent:", openPostId, rootId, is_root);
            processRefreshIntentEvent.raise(openPostId, rootId, is_root, !!ChromeShack.isPostReplyMutation);
        }
    },

    refreshIntentHandler(lastPostId, lastRootId, is_root, from_reply) {
        // make sure to save the ids of the open posts so we can reopen them later
        ChromeShack.isPostRefreshMutation = {lastPostId, lastRootId, is_root, from_reply};
        // keep track of what's being refreshed
        ChromeShack.refreshingThreads[lastRootId] = ChromeShack.isPostRefreshMutation;
        // listen for when tag data gets mutated (avoid duplicates!)
        processEmptyTagsLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
        processTagDataLoadedEvent.addHandler(ChromeShack.postRefreshHandler);
    },

    postRefreshHandler(post, root, postHasTags, rootHasTags) {
        // should be raised after a post is populated with tag data
        processEmptyTagsLoadedEvent.removeHandler(ChromeShack.postRefreshHandler);
        processTagDataLoadedEvent.removeHandler(ChromeShack.postRefreshHandler);
        let rootId = root && root.id.substr(5);
        if (ChromeShack.debugEvents)
            console.log("raising processPostRefreshEvent:", post, root, postHasTags, rootHasTags);
        if (!post) {
            // if we're called from a reply handler that can't pass a postId then find it ourselves
            let {lastPostId} = ChromeShack.isPostRefreshMutation || {};
            post = lastPostId && document.querySelector(`li#item_${lastPostId}`);
        }
        if (post || root) processPostRefreshEvent.raise(post, root, postHasTags, rootHasTags);
        // since we're done refreshing remove this thread from our tracking list
        delete ChromeShack.refreshingThreads[rootId];
        ChromeShack.isPostRefreshMutation = {};
    },

    processFullPosts() {
        // process fullposts
        let items = [...document.querySelectorAll("div.fullpost")];
        for (let item of items || []) ChromeShack.processPost(item.parentNode, item.parentNode.id.substr(5));
        fullPostsCompletedEvent.raise();
        ChromeShack.hasInitialized = true;

        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({name: "chatViewFix"});
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({name: "scrollByKeyFix"});
    },

    processPost(item, root_id) {
        let post = elementMatches(item, "li[id^='item_']") || item.closest("li[id^='item_']");
        let is_root_post = !!elementMatches(post, ".root > ul > li");
        if (ChromeShack.debugEvents) console.log("raising processPostEvent:", post, root_id, is_root_post);
        processPostEvent.raise(post, root_id, is_root_post);
    },

    processPostBox(postbox) {
        if (ChromeShack.debugEvents) console.log("raising processPostBoxEvent:", postbox);
        if (postbox) processPostBoxEvent.raise(postbox);
    },

    processTagsLoaded(item) {
        if (!ChromeShack.falseTagEvent) {
            ChromeShack.falseTagEvent = true;
            return; // avoid processing false-positive tag events
        } else if (ChromeShack.falseTagEvent) {
            let {post, root} = locatePostRefs(item);
            let rootUpdatedTags = root && root.querySelectorAll(".tag-container.nonzero");
            let postUpdatedTags = post && post.querySelectorAll(".tag-container.nonzero");
            let rootHasTags = rootUpdatedTags ? rootUpdatedTags.length > 0 : false;
            let postHasTags = postUpdatedTags ? postUpdatedTags.length > 0 : false;
            if ((post || root) && (postHasTags || rootHasTags)) {
                if (ChromeShack.debugEvents)
                    console.log("raising processTagDataLoadedEvent:", post, root, postHasTags, rootHasTags);
                processTagDataLoadedEvent.raise(post, root, postHasTags, rootHasTags);
            } else if (post || root) {
                if (ChromeShack.debugEvents)
                    console.log("raising processEmptyTagsLoadedEvent:", post, root, postHasTags, rootHasTags);
                processEmptyTagsLoadedEvent.raise(post, root, postHasTags, rootHasTags);
            }
            ChromeShack.falseTagEvent = false;
        }
    },

    processReply(parentId) {
        if (parentId) {
            let post = document.querySelector(`li#item_${parentId} .sel.last`);
            let postId = post && post.id.substr(5);
            let root = post && post.closest(".root > ul > li");
            let rootId = root && root.id.substr(5);
            let is_root = !!elementMatches(post, ".root > ul > li");
            if (post && root) {
                // pass along our refreshed post and root post elements
                if (ChromeShack.debugEvents) console.log("raising processReplyEvent:", post, root);
                processReplyEvent.raise(post, root);
                // also raise the refresh intent event to alert listeners that we want to refresh (nuLOL fix)
                processRefreshIntentEvent.raise(postId, rootId, is_root, !!ChromeShack.isPostReplyMutation);
            }
        }
        ChromeShack.isPostReplyMutation = null;
    }
};

// make sure our async handlers are resolved before observing
Promise.all(deferredHandlers.map(async (cb) => await cb)).then(ChromeShack.install);
