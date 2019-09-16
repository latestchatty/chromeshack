let ChromeShack = {
    hasInitialized: false,

    debugEvents: true,

    install() {
        const observer_handler = mutationsList => {
            //if (ChromeShack.debugEvents) console.log(mutationsList);
            for (let mutation of mutationsList) {
                try {
                    if (mutation.target.matches("li[id^='item_']") &&
                        !!mutation.previousSibling && mutation.previousSibling.matches(".fullpost") &&
                        !mutation.addedNodes[0].matches("div.inlinereply") &&
                        mutation.removedNodes[0].matches("div.inlinereply")) {
                            // caught a reply event - pass along the parent post id
                            let parentId = mutation.target.id.substr(5);
                            return caughtReplyMutationEvent.raise(parentId);
                    }
                    else if (mutation.target.matches("span.tag-container.nonzero")) {
                        // caught a set of tags-loaded mutations - raise events for each one
                        let validatedNodes = [];
                        for (let i = 0; i < mutationsList.length; i++) {
                            let { post, root } = locatePostRefs(mutationsList[i].target);
                            for (let node of mutationsList[i].addedNodes || []) {
                                let matchedNode = validatedNodes.filter(x => x.post === post);
                                if (matchedNode.length === 0 && (node.nodeType === 3 || node.matches(".lol-tags"))) {
                                    validatedNodes.push({ post, root });
                                    ChromeShack.processTagDataLoaded(post, root);
                                }
                            }
                        }
                        return;
                    }
                } catch (e) { console.log("A problem occurred during event pre-processing:", e); }

                for (let node of mutation.addedNodes || []) {
                    try {
                        if (node instanceof HTMLElement) {
                            // user opened the inline reply panel
                            if (node.matches("div.inlinereply")) ChromeShack.processPostBox(node);
                            // user opened an inline post
                            else if (ChromeShack.hasInitialized && node.matches("span.tag-counts")) {
                                let { post, root } = locatePostRefs(node);
                                if (ChromeShack.debugEvents) console.log("raising processPostEvent:", post, root);
                                ChromeShack.processPost(post, root);
                            }
                            // user opened a post with empty nuLOL data (occurs with processPostEvent)
                            if (node.matches("span.tag-counts") && mutation.addedNodes.length === 2) {
                                let { post, root } = locatePostRefs(mutation.target);
                                if (!postContainsTags(post)) ChromeShack.processEmptyTagsLoaded(post, root);
                            }
                        }
                    } catch (e) { console.log("A problem occurred when processing a post:", e); }
                }
            }
        };
        let observer = new MutationObserver(observer_handler);
        observer.observe(document, { characterData: true, subtree: true, childList: true });

        ChromeShack.processFullPosts();

        // wire up some transient events to pass mutated/to-be-mutated refs to other handlers
        caughtReplyMutationEvent.addHandler(ChromeShack.handleReplyMutation);
        document.addEventListener("click", (e) => {
            // we only process clicks on thread refresh buttons
            if (e && e.target && e.target.matches("div.refresh > a")) {
                let { post, root } = locatePostRefs(e.target);
                // wait on the tags to load after a refresh before firing off an event
                if (post && root) processTagDataLoadedEvent.addHandler(ChromeShack.processRefresh);
            }
        });
    },

    processFullPosts() {
        // this event should fire only once the page is initially loaded
        let items = [...document.querySelectorAll("div.threads div.fullpost")];
        for (let item of items || []) {
            let { post, root } = locatePostRefs(item);
            if (post && root) ChromeShack.processPost(post, root);
        }

        if (ChromeShack.debugEvents) console.log("raising fullPostsCompletedEvent");
        ChromeShack.hasInitialized = true;
        fullPostsCompletedEvent.raise();
        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({ name: "chatViewFix" });
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({ name: "scrollByKeyFix" });
    },

    processPost(post, root) {
        // this event should fire whenever a fullpost is opened
        let root_id = root.id.substr(5);
        let is_root_post = root.matches("div.threads .root");
        processPostEvent.raise(post, root_id, is_root_post);
        // manually fire off our empty tag event on initial page load
        if (!ChromeShack.hasInitialized && post && root && !postContainsTags(post))
            ChromeShack.processEmptyTagsLoaded(post, root);
    },

    processPostBox(postbox) {
        // this event should fire when the "Reply" button opens its inline reply box
        processPostBoxEvent.raise(postbox);
    },

    handleReplyMutation(parentId) {
        // this event should fire when a reply is posted and a new fullpost is initially injected
        let post = parentId && document.querySelector(`div.threads li#item_${parentId} .last.sel`);
        let root = post && post.closest("div.threads .root > ul > li");
        if (post && root) {
            if (ChromeShack.debugEvents) console.log("passing handleReplyMutation refs along:", post, root);
            processPostEvent.addHandler(ChromeShack.processReply);
        }
    },

    processReply(post, root) {
        // this event should fire when a reply is done loading tag data
        processPostEvent.removeHandler(ChromeShack.processReply);
        if (post && root) {
            console.log("raising processReplyEvent:", post, root);
            processReplyEvent.raise(post, root, true);
        }
    },

    processRefresh(post, root) {
        // this event should fire when any fullpost's refresh/uncollapse button is clicked
        processTagDataLoadedEvent.removeHandler(ChromeShack.processRefresh);
        if (post && root) {
            if (ChromeShack.debugEvents) console.log("raising processRefreshEvent:", post, root);
            processRefreshEvent.raise(post, root);
        }
    },

    processEmptyTagsLoaded(post, root) {
        // this event should fire when the fullpost's nuLOL tag line is loaded without data
        if (post && root) {
            if (ChromeShack.debugEvents) console.log("raising processEmptyTagsLoaded:", post, root);
            processEmptyTagsLoadedEvent.raise(post, root);
        }
    },

    processTagDataLoaded(post, root) {
        // this event should fire after the thread/post has been populated
        if (post && root) {
            if (ChromeShack.debugEvents) console.log("raising processTagDataLoaded:", post, root);
            processTagDataLoadedEvent.raise(post, root);
        }
    }
};

// make sure our async handlers are resolved before observing
Promise.all(deferredHandlers.map(async cb => await cb)).then(ChromeShack.install);
