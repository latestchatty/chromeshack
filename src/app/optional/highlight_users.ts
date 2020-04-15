import { getSetting, enabledContains } from "../core/settings";
import { insertStyle } from "../core/common";
import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";

const HighlightUsers = {
    userRegex: /(?:<div class=\\?"oneline.+?olauthor_(\d+))[\s\S]+?class=\\?"oneline_user.+?>(.+?)<\/span(?:.+?alt=\\?"(moderator)?\\?")?/gi,

    cache: [],

    async install() {
        const is_enabled = await enabledContains("highlight_users");
        if (is_enabled) {
            fullPostsCompletedEvent.addHandler(HighlightUsers.applyFilter);
            // refresh our styling state when refreshing a post
            processPostRefreshEvent.addHandler(HighlightUsers.applyFilter);
        }
    },

    resolveUsers(refresh?) {
        // memoize this resolution method for speed
        if (!refresh && HighlightUsers.cache.length > 0) return HighlightUsers.cache;
        const uniques = [];
        const rootHTML = (<HTMLElement>document.querySelector("div.threads")).innerHTML;
        // match#1 = olid, match#2 = fpid, match#3 = username, match#4 = mod-flag
        const matches = [...rootHTML.matchAll(HighlightUsers.userRegex)];
        for (const i of matches) {
            const id = i[1];
            // don't scrape the Shame Switchers name extension
            const name = i[2] && i[2].split(" - ")[0];
            const mod = !!i[3];
            // only include unique ids (can be the same username)
            if (!uniques.find((v) => v.id === id)) uniques.push({ id, name, mod });
        }
        HighlightUsers.cache = uniques;
        return HighlightUsers.cache;
    },

    gatherCSS(users, groups) {
        let css = "";
        for (const group of groups || []) {
            if (group.enabled) {
                if (group.name === "Original Poster") css += `div.oneline.op span.oneline_user { ${group.css} }`;
                else if (group.name === "Mods") {
                    for (const { id, mod } of users) {
                        if (mod)
                            css += `div.fpauthor_${id} span.author span.user>a, div.olauthor_${id} span.oneline_user { ${group.css} }`;
                    }
                } else {
                    for (const { id, name } of users) {
                        if (group.users && group.users.includes(name) && group.css.length > 0)
                            css += `div.fpauthor_${id} span.author span.user>a, div.olauthor_${id} span.oneline_user { ${group.css} }`;
                    }
                }
            }
        }
        // don't highlight current user as mod/employee/dev
        css += " span.this_user { color: rgb(0, 191, 243) !important; }";
        insertStyle(css, "highlighted-users");
    },

    applyFilter() {
        // we just need to run this once per page
        return getSetting("highlight_groups").then(async (groups) => {
            const users = await HighlightUsers.resolveUsers();
            HighlightUsers.gatherCSS(users, groups);
        });
    },
};

export default HighlightUsers;
