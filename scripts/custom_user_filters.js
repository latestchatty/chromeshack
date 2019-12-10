let CustomUserFilters = {
    parsedUsers: [],

    rootPostCount: 0,

    resolveUser(username) {
        // cache parsed page users locally (using HighlightUsers' resolver)
        if (CustomUserFilters.parsedUsers.length === 0)
            CustomUserFilters.parsedUsers = HighlightUsers.resolveUsers();
        return CustomUserFilters.parsedUsers.filter(v => v.name === username);
    },

    async removeOLsFromUserId(id) {
        let postElems;
        let hideFPs = await getEnabledSuboptions("cuf_hide_fullposts");
        if (hideFPs) postElems = [...document.querySelectorAll(`div.olauthor_${id}, div.fpauthor_${id}`)];
        else postElems = [...document.querySelectorAll(`div.olauthor_${id}`)];
        for (let post of postElems || []) {
            let ol = post.matches(".oneline") && post;
            let fp = hideFPs && post.matches(".fullpost") && post;
            let root = fp && fp.closest(".root");
            if (ol && ol.parentNode.matches("li")) {
                // remove all subreplies along with the matched post
                let matchedNode = ol.parentNode;
                while (matchedNode.firstChild)
                    matchedNode.removeChild(matchedNode.firstChild);
            }
            else if (fp && root && CustomUserFilters.rootPostCount > 2) {
                // only remove root if we're in thread mode
                root.parentNode.removeChild(root);
            }
        }
        // refresh just in case the removed post(s) would be shown in thread pane
        if (await enabledContains("thread_pane") &&
            typeof refreshThreadPane === "function" && postElems && postElems.length > 0)
            refreshThreadPane(); // don't forget to update the thread pane
    },

    applyFilter() {
        getSetting("user_filters").then(async filteredUsers => {
            if (!filteredUsers || filteredUsers.length === 0) return;
            CustomUserFilters.rootPostCount = document.querySelector(".threads").childElementCount;
            for (let filteredUser of filteredUsers) {
                let userMatches = CustomUserFilters.resolveUser(filteredUser);
                for (let userMatch of userMatches)
                    await CustomUserFilters.removeOLsFromUserId(userMatch.id);
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
