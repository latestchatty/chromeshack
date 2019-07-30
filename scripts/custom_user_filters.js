let CustomUserFilters = {
    parsedUsers: [],

    resolveUser(username) {
        // cache parsed page users locally (using HighlightUsers' resolver)
        if (CustomUserFilters.parsedUsers.length === 0)
            CustomUserFilters.parsedUsers = HighlightUsers.resolveUsers();
        return CustomUserFilters.parsedUsers.filter(v => v.name === username);
    },

    removeOLsFromUserId(id) {
        let olDivs = [...document.querySelectorAll(`div.olauthor_${id}`)];
        for (let ol of olDivs || []) {
            let postLi = ol.parentNode;
            let isOLOfParent = ol.parentNode.parentNode.parentNode.matches(".root");
            if (!isOLOfParent && postLi.tagName === "LI")
                postLi.parentNode.removeChild(postLi);
        }
    },

    applyFilter() {
        getSetting("user_filters").then(filteredUsers => {
            if (!filteredUsers || filteredUsers.length === 0) return;
            for (let filteredUser of filteredUsers) {
                let userMatches = CustomUserFilters.resolveUser(filteredUser);
                for (let userMatch of userMatches)
                    CustomUserFilters.removeOLsFromUserId(userMatch.id);
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

addDeferredHandler(enabledContains("custom_user_filters"), res => {
    if (res) CustomUserFilters.install();
});
