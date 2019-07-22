let HighlightUsers = {
    userRegex: /(?:olauthor_(\d+)+|fpauthor_(\d+)+)[\s\S]+?oneline_user\s?">(.*?)<\/span>(?:.+?(moderator)?\.png\")[\s\S]+?ul>/gi,

    resolveUsers() {
        let uniques = [];
        let rootHTML = document.querySelector("div.threads").innerHTML;
        // match#1 = olid, match#2 = fpid, match#3 = username, match#4 = mod-flag
        let matches = [...rootHTML.matchAll(HighlightUsers.userRegex)];
        for (let i of matches) {
            let parsedId = i[1] || i[2];
            // don't scrape the Shame Switchers name extension
            let parsedName = i[3].split(" - ")[0];
            let parsedMod = i[4];
            // only include unique ids (can be the same username)
            if (!uniques.find(v => v.id === v.parsedId))
                uniques.push({ id: parsedId, name: parsedName, mod: parsedMod });
        }
        return uniques.flat();
    },

    gatherCSS(users, built_ins, user_groups) {
        let css = "";
        let groups = [...built_ins, ...user_groups];
        for (let group of groups) {
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
        return getSetting("highlight_users_builtin").then(async (built_ins) =>
            HighlightUsers.gatherCSS(
                await HighlightUsers.resolveUsers(),
                built_ins,
                await getSetting("highlight_users_added")
            )
        );
    }
};

addDeferredHandler(enabledContains("highlight_users"), (res) => {
    if (res) fullPostsCompletedEvent.addHandler(HighlightUsers.install);
});
