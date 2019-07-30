let HighlightUsers = {
    userRegex: /(?:olauthor_|fpauthor_)(\d+)+?[\s\S]+?(?:(?:"\/user\/(.*?)\/|oneline_user ">(.*?)\<\/))[\s\S]+?(?:.*?\/(moderator)\.png")?/gi,

    cache: [],

    resolveUsers(refresh) {
        // memoize this resolution method for speed
        if (!refresh && HighlightUsers.cache.length > 0)
            return HighlightUsers.cache;

        let uniques = [];
        let rootHTML = document.querySelector("div.threads").innerHTML;
        // match#1 = olid, match#2 = fpid, match#3 = username, match#4 = mod-flag
        let matches = [...rootHTML.matchAll(HighlightUsers.userRegex)];
        for (let i of matches) {
            let id = i[1];
            // don't scrape the Shame Switchers name extension
            let name = i[2] && i[2].split(" - ")[0] ||
                i[3] && i[3].split(" - ")[0];
            let mod = !!i[4];
            // only include unique ids (can be the same username)
            if (!uniques.find(v => v.id === id)) uniques.push({ id, name, mod });
        }
        HighlightUsers.cache = [...HighlightUsers.cache, uniques];
        return uniques;
    },

    gatherCSS(users, groups) {
        let css = "";
        for (let group of groups || []) {
            if (group.enabled) {
                if (group.name === "Original Poster") {
                    css += `div.oneline.op span.oneline_user { ${group.css} }`;
                } else if (group.name === "Mods") {
                    for (let {id, mod} of users) {
                        if (mod) css += `div.fpauthor_${id} span.author span.user>a, div.olauthor_${id} span.oneline_user { ${group.css} }`;
                    }
                } else {
                    for (let {id, name} of users) {
                        if (group.users && group.users.includes(name) && group.css.length > 0)
                            css += `div.fpauthor_${id} span.author span.user>a, div.olauthor_${id} span.oneline_user { ${group.css} }`;
                    }
                }
            }
        }
        // don't highlight current user as mod/employee/dev
        css += " div.oneline a.this_user{color: rgb(0, 191, 243) !important;}";
        insertStyle(css, "highlighted-users");
    },

    install() {
        // we just need to run this once per page
        return getSetting("highlight_groups").then(async groups => {
            let users = await HighlightUsers.resolveUsers();
            HighlightUsers.gatherCSS(users, groups);
        });
    }
};

addDeferredHandler(enabledContains("highlight_users"), (res) => {
    if (res) fullPostsCompletedEvent.addHandler(HighlightUsers.install);
});
