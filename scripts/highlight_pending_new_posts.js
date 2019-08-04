let HighlightPendingPosts = {
    lastEventId: 0,

    processEvents(events) {
        for (let evt of events || []) {
            if (evt.eventType === "newPost") {
                let postId = parseInt(evt.eventData.postId);
                // Received an event for a post we already have.
                if (document.getElementById(`item_${postId}`) !== null) continue;
                let threadId = parseInt(evt.eventData.post.threadId);
                let a = document.querySelector(`li#item_${threadId} div.fullpost div.refresh a`);
                if (a !== null) a.classList.add("refresh_pending");
            }
        }
        HighlightPendingPosts.showOrHideJumpToNewPostButton();
        // if the Thread Pane script is loaded, then refresh the thread pane
        if (typeof refreshThreadPane !== "undefined") refreshThreadPane();
    },

    loop() {
        fetchSafe(`https://winchatty.com/v2/waitForEvent?lastEventId=${HighlightPendingPosts.lastEventId}`)
            .then((json) => {
                // sanitized in common.js!
                if (json.events) {
                    HighlightPendingPosts.lastEventId = json.lastEventId && parseInt(json.lastEventId);
                    HighlightPendingPosts.processEvents(json.events);
                }
                // Short delay in between loop iterations.
                setTimeout(HighlightPendingPosts.loop, 5000);
            });
    },

    isCollapsed(aRefresh) {
        let divRefresh = aRefresh.parentNode;
        if (!divRefresh) return false;
        let divFullpost = divRefresh.parentNode;
        if (!divFullpost) return false;
        let li = divFullpost.parentNode;
        if (!li) return false;
        let ul = li.parentNode;
        if (!ul) return false;
        let root = ul.parentNode;
        return root && root.tagName == "DIV" && root.className.split(" ").indexOf("collapsed") !== -1;
    },

    getNonCollapsedPendings() {
        let pendings = document.getElementsByClassName("refresh_pending");
        let filtered = [];

        for (let i = 0; i < pendings.length; i++) {
            if (!HighlightPendingPosts.isCollapsed(pendings[i])) filtered.push(pendings[i]);
        }
        return filtered;
    },

    jumpToNewPost(e) {
        e.preventDefault();
        let aRefreshes = HighlightPendingPosts.getNonCollapsedPendings();
        if (aRefreshes.length > 0) {
            let scroll = $(window).scrollTop();
            let divFirstFullPost = aRefreshes[0].parentNode.parentNode.parentNode;

            for (let i = 0; i < aRefreshes.length; i++) {
                let aRefresh = aRefreshes[i];
                let divPostItem = aRefresh.parentNode.parentNode.parentNode;
                let offset = $(divPostItem).offset().top;

                // if the element would be elsewhere on the page - scroll to it
                if (!elementIsVisible(divPostItem, true) && offset > scroll) {
                    scrollToElement(divPostItem);
                    return;
                }
            }

            // default to the first pending post
            scrollToElement(divFirstFullPost);
        }
    },

    installJumpToNewPostButton() {
        let position = document.querySelector(".header-bottom .logo.alt");
        let starContainer = document.createElement("div");
        let star = document.createElement("a");
        starContainer.setAttribute("id", "post_highlighter_container");
        starContainer.classList.add("hidden");
        star.setAttribute("id", "jump_to_new_post");
        star.addEventListener("click", HighlightPendingPosts.jumpToNewPost);

        starContainer.appendChild(star);
        position.appendChild(starContainer);
        // position.parentNode.insertBefore(starContainer, position);
    },

    showOrHideJumpToNewPostButton() {
        let pending = HighlightPendingPosts.getNonCollapsedPendings();
        let button = document.getElementById("post_highlighter_container");
        let indicator = "★ ";
        let titleHasIndicator = document.title.startsWith(indicator);

        if (pending.length > 0) {
            if (button !== null) {
                button.classList.remove("hidden");
            }
            if (!titleHasIndicator) {
                document.title = indicator + document.title;
            }

            $(document.getElementById("jump_to_new_post")).html(indicator + pending.length.toString());
        } else {
            if (button !== null) {
                button.classList.add("hidden");
            }
            if (titleHasIndicator) {
                document.title = document.title.substring(indicator.length);
            }
        }
    },

    install() {
        // Only install on the main /chatty page, not an individual thread.
        if (document.getElementById("newcommentbutton") === null) {
            return;
        }

        // Only install on the first page of the chatty.
        let aSelectedPages = document.getElementsByClassName("selected_page");
        if (aSelectedPages.length === 0 || aSelectedPages[0].innerHTML !== "1") {
            return;
        }

        HighlightPendingPosts.installJumpToNewPostButton();

        // Recalculate the "jump to new post" button's visibility when the user refreshes a thread.
        document.getElementById("dom_iframe").addEventListener("load", () => {
            // This is fired BEFORE the onload inside the Ajax response, so we need to wait until
            // the inner onload has run.
            setTimeout(HighlightPendingPosts.showOrHideJumpToNewPostButton, 0);
        });

        // Trying to get a notification when the user collapses a post.  This is easy...
        document.addEventListener("click", () => {
            // Same trick as above; let's wait until other events have executed.
            setTimeout(HighlightPendingPosts.showOrHideJumpToNewPostButton, 0);
        });

        // We need to get an initial event ID to start with.
        fetchSafe("https://winchatty.com/v2/getNewestEventId").then((json) => {
            // sanitized in common.js!
            HighlightPendingPosts.lastEventId = parseInt(json.eventId);
            HighlightPendingPosts.loop();
        });
    }
};

addDeferredHandler(enabledContains("highlight_pending_new_posts"), (res) => {
    if (res) HighlightPendingPosts.install();
});
