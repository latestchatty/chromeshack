let CustomUserFilters = {
    parsedUsers: [],

    rootPostCount: 0,

    resolveUser(username) {
        // cache parsed page users locally (using HighlightUsers' resolver)
        if (CustomUserFilters.parsedUsers.length === 0)
            CustomUserFilters.parsedUsers = HighlightUsers.resolveUsers();
        return CustomUserFilters.parsedUsers.filter(v => v.name === username);
    },

    removeOLsFromUserId(id) {
        getEnabledSuboptions("cuf_hide_fullposts").then(async (hideFPs) => {
            let postElems;
            if (hideFPs) postElems = [...document.querySelectorAll(`div.olauthor_${id}, div.fpauthor_${id}`)];
            else postElems = [...document.querySelectorAll(`div.olauthor_${id}`)];
            for (let post of postElems || []) {
                let ol = post.matches(".oneline") && post;
                let fp = hideFPs && post.matches(".fullpost") && post;
                let root = fp && fp.closest(".root");
                if (ol && ol.parentNode.matches("li"))
                    ol.parentNode.removeChild(post);
                else if (fp && root && CustomUserFilters.rootPostCount > 2) {
                    // only remove root if we're in thread mode
                    root.parentNode.removeChild(root);
                    if (await enabledContains("thread_pane") && refreshThreadPane !== undefined) {
                        refreshThreadPane(); // don't forget to update the thread pane
                    }
                }
            }
        });
    },

    applyFilter() {
        getSetting("user_filters").then(filteredUsers => {
            if (!filteredUsers || filteredUsers.length === 0) return;
            CustomUserFilters.rootPostCount = document.querySelector(".threads").childElementCount;
            for (let filteredUser of filteredUsers) {
                let userMatches = CustomUserFilters.resolveUser(filteredUser);
                for (let userMatch of userMatches)
                    CustomUserFilters.removeOLsFromUserId(userMatch.id);
            }
        });
    }
};

addDeferredHandler(enabledContains("custom_user_filters"), res => {
    if (res) {
        processPostRefreshEvent.addHandler(CustomUserFilters.applyFilter);
        CustomUserFilters.applyFilter();
    }
});
