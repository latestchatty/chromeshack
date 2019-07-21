let CustomUserFilters = {
    resolveUser(username) {
        // similar to HighlightUsers 'resolveUsers()' except for a specific username
        let roots = [...document.querySelectorAll("div.root")];
        for (let i of roots) {
            // borrow the regex pattern from HighlightUsers
            let matches = [...i.outerHTML.matchAll(HighlightUsers.userRegex)];
            for (let m of matches) {
                let parsedUser = m[3].toLowerCase().split(" - ")[0];
                let parsedId = m[1] || m[2];
                // return the first match for this username
                if (parsedUser === username.toLowerCase())
                    return { id: parsedId, name: parsedUser };
            }
        }
    },

    removeOLsFromUserId(id) {
        let olDivs = [...document.querySelectorAll(`div.olauthor_${id}`)];
        for (let ol of olDivs || []) {
            let postLi = ol.parentNode;
            if (postLi.tagName === "LI") postLi.parentNode.removeChild(postLi);
        }
    },

    applyFilter() {
        getSetting("user_filters").then(filteredUsernames => {
            if (!Array.isArray(filteredUsernames)) return;
            let usernameIdMap = {};
            for (let i = 0; i < filteredUsernames.length; i++) {
                let username = filteredUsernames[i];
                if (!objContains(username, usernameIdMap)) {
                    let { id } = CustomUserFilters.resolveUser(username) || {};
                    // save our resolved
                    if (id >= 0) usernameIdMap[username] = id;
                }
                CustomUserFilters.removeOLsFromUserId(usernameIdMap[username]);
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
