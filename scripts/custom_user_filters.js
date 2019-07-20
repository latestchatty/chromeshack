let CustomUserFilters = {
    getUserId(username) {
        // Look for a post on this page from this username.
        let classPrefix = "olauthor_";
        username = superTrim(username).toLowerCase();
        let userSpans = document.querySelectorAll("span.oneline_user");
        for (let i = 0; i < userSpans.length; i++) {
            let spanText = superTrim(userSpans[i].innerHTML).toLowerCase();
            if (username == spanText) {
                let parentDiv = userSpans[i].parentNode;
                if (parentDiv.tagName !== "DIV") {
                    continue; // Sanity check
                }
                let classNames = parentDiv.className.split(/\s+/);
                for (let j = 0; j < classNames.length; j++) {
                    let className = classNames[j];

                    if (className.startsWith(classPrefix)) {
                        return parseInt(className.substring(classPrefix.length));
                    }
                }
            }
        }
        return -1;
    },

    removePostsFromUserId(id) {
        let postDivs = document.querySelectorAll("div.olauthor_" + id);
        for (let i = 0; i < postDivs.length; i++) {
            let postDiv = postDivs[i];
            let postLi = postDiv.parentNode;
            if (postLi.tagName === "LI") {
                postLi.parentNode.removeChild(postLi);
            }
        }
    },

    applyFilter() {
        getSetting("user_filters").then(filteredUsernames => {
            if (!Array.isArray(filteredUsernames)) return;
            // The CSS class for a user's posts includes an ID, so we need to map from usernames to IDs.
            // We'll save this map into a setting so we only have to do this once per username added to the filter list.
            let usernameIdMap = {};
            // Make sure each filtered username has a corresponding id in usernameIdMap.  Then hide posts from that user
            // by setting the CSS for their posts.
            for (let i = 0; i < filteredUsernames.length; i++) {
                let username = filteredUsernames[i];
                if (!objContains(username, usernameIdMap)) {
                    let id = CustomUserFilters.getUserId(username);
                    if (id >= 0) {
                        usernameIdMap[username] = id;
                    }
                }
                CustomUserFilters.removePostsFromUserId(usernameIdMap[username]);
            }
        });
    },

    install() {
        // Re-filter when a thread is updated by the "refresh" button.
        document.getElementById("dom_iframe").addEventListener("load", () => {
            // This is fired BEFORE the onload inside the Ajax response, so we need to wait until
            // the inner onload has run.
            setTimeout(CustomUserFilters.applyFilter, 0);
        });
        CustomUserFilters.applyFilter();
    }
};

addDeferredHandler(settingsContain("custom_user_filters"), res => {
    if (res) CustomUserFilters.install();
});
