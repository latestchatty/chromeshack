import { domMeasure, insertStyle, objHas } from "../core/common";
import { processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting } from "../core/settings";

export const HighlightUsers = {
    cache: {} as ResolvedUsers,

    async install() {
        await HighlightUsers.applyFilter();
        // refresh our styling state when refreshing a post
        processPostRefreshEvent.addHandler(HighlightUsers.applyFilter);
    },

    async resolveUsers() {
        if (objHas(HighlightUsers.cache)) return HighlightUsers.cache;
        const compiled = {} as ResolvedUsers;
        const posts = [...document.querySelectorAll("li[id^='item_'")];
        const process = (post: HTMLElement) => {
            const postid = parseInt(post?.id?.substr(5));
            const postdiv = post.querySelector(".fullpost, .oneline");
            const op = postdiv.querySelector(".root>ul>li li>.fullpost.op");
            const id =
                parseInt(postdiv?.getAttribute("class")?.split("olauthor_")?.[1]) ||
                parseInt(postdiv?.getAttribute("class")?.split("fpauthor_")?.[1]);
            const username =
                post.querySelector("span.oneline_user")?.textContent ||
                post.querySelector("span.user")?.textContent ||
                post.querySelector("span.user>a")?.textContent;
            const mod = postdiv?.querySelector("a.shackmsg ~ img[alt='moderator']");
            return { id, mod: !!mod, op: !!op, postid, username };
        };
        await domMeasure(() => {
            for (const p of posts) {
                const r = process(p as HTMLElement);
                if (!compiled[r.username]) compiled[r.username] = [r];
                else compiled[r.username].push(r);
            }
        });
        HighlightUsers.cache = compiled;
        return HighlightUsers.cache;
    },

    async resolveUser(username: string) {
        // renew the cache if this gets called before HU has a chance to run
        if (Object.keys(HighlightUsers.cache).length === 0) await HighlightUsers.resolveUsers();
        return HighlightUsers.cache[username];
    },

    gatherCSS(users: ResolvedUsers, groups: HighlightGroup[]) {
        let css = "";
        const usernames = Object.keys(users);
        for (const user of usernames || [])
            for (const group of groups || [])
                if (group.enabled)
                    if (group.name === "Original Poster")
                        css += `div.oneline.op span.oneline_user, .cs_thread_pane_reply_author.op { ${group.css} } `;
                    else if (group.name === "Mods") {
                        const { id, mod } = users[user]?.[0];
                        if (mod) {
                            const rules = [
                                `div.fpauthor_${id} span.author span.user>a`,
                                `div.chattypost__hdr.fpauthor_${id} span.username>a`,
                                `div.olauthor_${id} span.oneline_user`,
                                `.authorid_${id}, .replyid_${id}`,
                            ].join(", ");
                            css += `${rules} { ${group.css} } `;
                        }
                    } else {
                        const { id } = users[user]?.[0];
                        const foundUser = group.users?.find((u) => u.toLowerCase() === user.toLowerCase());
                        if (foundUser && group.css.length > 0) {
                            const rules = [
                                `div.fpauthor_${id} span.author span.user>a`,
                                `div.chattypost__hdr.fpauthor_${id} span.username>a`,
                                `div.olauthor_${id} span.oneline_user`,
                                `.authorid_${id}, .replyid_${id}`,
                            ].join(", ");
                            css += `${rules} { ${group.css} } `;
                        }
                    }

        // don't highlight current user as mod/employee/dev
        css += "span.this_user { color: rgb(0, 191, 243) !important; }";
        insertStyle(css, "highlighted-users");
    },

    async applyFilter() {
        const is_enabled = await enabledContains(["highlight_users"]);
        if (is_enabled) {
            const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
            const users = await HighlightUsers.resolveUsers();
            // we just need to run this once per page
            HighlightUsers.gatherCSS(users, groups);
        }
    },
};
