let HighlightPendingPosts = {
    lastEventId: 0,

    lastIndex: -1,

    pendings: [],

    marked: [],

    updatePendings(refreshElem) {
        for (let pending of HighlightPendingPosts.pendings || []) {
            // Received an event for a post we already have.
            if (document.getElementById(`item_${pending.postId}`)) continue;
            let a = document.querySelector(`li#item_${pending.threadId} div.fullpost div.refresh a`);
            if (a) a.classList.add("refresh_pending");
        }
        HighlightPendingPosts.updateJumpToNewPostButton(refreshElem);
        // if the Thread Pane script is loaded, then refresh the thread pane
        if (refreshThreadPane) refreshThreadPane();
    },

    fetchPendings() {
        fetchSafe({
            url: `https://winchatty.com/v2/waitForEvent?lastEventId=${HighlightPendingPosts.lastEventId}`
        })
        .then((json) => {
            // sanitized in common.js!
            if (json.events) {
                HighlightPendingPosts.lastEventId = parseInt(json.lastEventId);
                let newPosts = [...json.events.filter(x => x.eventType === "newPost")];
                let newPendingEvents = [];
                for (let post of newPosts) {
                    newPendingEvents.push({
                        postId: parseInt(post.eventData.postId),
                        threadId: parseInt(post.eventData.post.threadId)
                    });
                }
                HighlightPendingPosts.pendings = newPendingEvents;
                HighlightPendingPosts.updatePendings();
            }
            // Short delay in between loop iterations.
            setTimeout(HighlightPendingPosts.fetchPendings, 5000);
        });
    },

    excludeRefreshed(refreshElem) {
        if (!refreshElem) return;
        let closestId = refreshElem && refreshElem.closest("li[id^='item_']").id.substr(5);
        let mutated = [...HighlightPendingPosts.pendings
            .filter(x => x.postId !== closestId || x.threadId !== closestId)];
        HighlightPendingPosts.pendings = mutated;
    },

    isCollapsed(elem) {
        return elem && elem.closest("div.root.collapsed");
    },

    isPending(elem) {
        return elem && elem.matches("a.refresh_pending") && elem.closest("div.refresh a") === elem;
    },

    getNonCollapsedPendings(refreshElem) {
        HighlightPendingPosts.excludeRefreshed(refreshElem);
        let pendings = [...document.querySelectorAll("a.refresh_pending")];
        let filtered = [];
        for (let pending of pendings) {
            // include only non-refreshed/non-collapsed pendings
            if (HighlightPendingPosts.isPending(pending) &&
                !HighlightPendingPosts.isCollapsed(pending))
                filtered.push(pending);
        }
        HighlightPendingPosts.marked = filtered;
    },

    installJumpToNewPostButton() {
        let position = document.querySelector(".header-bottom .logo.alt");
        let starContainer = document.createElement("div");
        let star = document.createElement("a");
        starContainer.setAttribute("id", "post_highlighter_container");
        starContainer.classList.add("hidden");
        star.setAttribute("id", "jump_to_new_post");
        star.addEventListener("click", (e) => {
            e.preventDefault();
            // simple incrementing carousel
            let pendingLen = HighlightPendingPosts.marked.length;
            let newIndex = (HighlightPendingPosts.lastIndex + 1 + pendingLen) % pendingLen;
            let divPostItem = HighlightPendingPosts.marked[newIndex] &&
                HighlightPendingPosts.marked[newIndex].closest("li[id^='item_']");
            scrollToElement(divPostItem);
            HighlightPendingPosts.lastIndex = newIndex;
        });
        starContainer.appendChild(star);
        position.appendChild(starContainer);
    },

    updateJumpToNewPostButton(refreshElem) {
        let button = document.getElementById("post_highlighter_container");
        let indicator = "★ ";
        let titleHasIndicator = document.title.startsWith(indicator);
        let pendingPostBtn = document.getElementById("jump_to_new_post");
        HighlightPendingPosts.getNonCollapsedPendings(refreshElem);
        if (HighlightPendingPosts.marked.length > 0) {
            if (button) button.classList.remove("hidden");
            if (!titleHasIndicator) document.title = indicator + document.title;
            pendingPostBtn.innerText = indicator + HighlightPendingPosts.marked.length.toString();
        } else {
            if (button) button.classList.add("hidden");
            if (titleHasIndicator) document.title = document.title.substring(indicator.length);
        }
    },

    install() {
        // Only install on the main /chatty page, not an individual thread.
        if (!document.getElementById("newcommentbutton")) return;
        // Only install on the first page of the chatty.
        let aSelectedPages = document.getElementsByClassName("selected_page");
        if (aSelectedPages.length === 0 || aSelectedPages[0].innerHTML !== "1") return;
        HighlightPendingPosts.installJumpToNewPostButton();
        // Recalculate the "jump to new post" button's visibility when the user refreshes/toggles a thread
        document.addEventListener("click", (e) => {
            if (e.target.matches("div.refresh a") ||
                e.target.matches("a.closepost") || e.target.matches("a.showpost")) {
                (refreshElem => {
                    document.getElementById("dom_iframe").addEventListener("load", () => {
                        HighlightPendingPosts.updatePendings();
                        HighlightPendingPosts.updateJumpToNewPostButton(refreshElem);
                    });
                })(e.target);
            }
        });
        // We need to get an initial event ID to start with.
        fetchSafe({ url: "https://winchatty.com/v2/getNewestEventId" }).then((json) => {
            // sanitized in common.js!
            HighlightPendingPosts.lastEventId = parseInt(json.eventId);
            HighlightPendingPosts.fetchPendings();
        });
    }
};

addDeferredHandler(enabledContains("highlight_pending_new_posts"), (res) => {
    if (res) HighlightPendingPosts.install();
});
