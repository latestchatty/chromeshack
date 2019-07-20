let HighlightUsers = {
    userRegex: /(?:olauthor_(\d+)+|fpauthor_(\d+)+)[\s\S]+?oneline_user\s?">(.*?)<\/span/gim,

    install() {
        // we just need to run this once per page
        return getSetting("highlight_users_groups").then(groups => {
            HighlightUsers.resolveUsers().then(users => {
                HighlightUsers.gatherCSS(users, groups);
            });
        })
    },

    async resolveUsers() {
        let roots = [...document.querySelectorAll("div.root")];
        let uniques = [];
        for (let i of roots) {
            // match#1 = olid, match#2 = fpid, match#3 = username
            let _matches = [...i.outerHTML.matchAll(HighlightUsers.userRegex)];
            let _uniques = _matches.reduce((a, i) => (
                objContains(i[1] || i[2], a) ? a : [...a, { id: i[1] || i[2], name: i[3].split(" - ")[0] }]
            ), []);
            // only include unique userids
            uniques.push(_uniques);
        }
        // return a flat array of records for all threads
        return await uniques.flat();
    },

    gatherCSS(users, groups) {
        let css = "";
        for (let group of groups) {
            if (group.name === "Original Poster") {
                css += `div.oneline.op span.oneline_user { ${group.css} }`;
            } else {
                for (let { id, name } of users) {
                    if (group.users.includes(name) && group.css.length > 0)
                        css += `div.fpauthor_${id} span.author span.user>a, div.olauthor_${id} span.oneline_user { ${
                            group.css
                        } }`;
                }
            }
        }
        // don't highlight current user as mod/employee/dev
        css += " div.oneline a.this_user{color: rgb(0, 191, 243) !important;}";
        insertStyle(css, "highlighted-users");
    }
};

addDeferredHandler(settingsContain("highlight_users"), res => {
    if (res) fullPostsCompletedEvent.addHandler(HighlightUsers.install);
});
