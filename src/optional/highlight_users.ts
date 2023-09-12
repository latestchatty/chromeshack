import { insertStyle, objHas } from "../core/common";
import { processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting } from "../core/settings";

export const HighlightUsers = {
    cache: {} as ResolvedUsers,

    async install() {
        await HighlightUsers.applyFilter();
        // refresh our styling state when refreshing a post
        processPostRefreshEvent.addHandler(HighlightUsers.applyFilter);
    },

    resolveUsers() {
        if (objHas(HighlightUsers.cache)) return HighlightUsers.cache;
        const compiled = {} as ResolvedUsers;
        const posts = [...document.querySelectorAll("li[id^='item_'")];
        const process = (post: HTMLElement) => {
            const postid = parseInt(post?.id?.substr(5));
            const fullpost = post.querySelector(".fullpost");
            const fullpostAuthor = fullpost?.getAttribute("class")?.split("fpauthor_");
            const oneline = post.querySelector(".oneline");
            const onelineAuthor = oneline?.getAttribute("class")?.split("olauthor_");
            const op = fullpost?.matches && fullpost.matches(".op");
            const fpauthor_id = fullpostAuthor && parseInt(fullpostAuthor?.[1]);
            const olauthor_id = onelineAuthor && parseInt(onelineAuthor?.[1]);
            const id = olauthor_id ?? fpauthor_id;
            const username =
                post.querySelector("span.oneline_user")?.textContent ??
                post.querySelector("span.user")?.textContent ??
                post.querySelector("span.user>a")?.textContent;
            const mod =
                fullpost?.querySelector("a.shackmsg ~ img[alt='moderator']") ??
                oneline?.querySelector("img.chatty-user-icons[alt='moderator']");
            return { id, mod: !!mod, op, postid, username };
        };
        for (const p of posts) {
            const r = process(p as HTMLElement);
            if (!compiled[r.username]) compiled[r.username] = [r];
            else compiled[r.username].push(r);
        }
        HighlightUsers.cache = compiled;
        return HighlightUsers.cache;
    },

    resolveUser(usernames: string[]) {
        // renew the cache if this gets called before HU has a chance to run
        if (Object.keys(HighlightUsers.cache).length === 0) HighlightUsers.resolveUsers();
        // return a filtered ResolvedUsers object for the query
        return usernames.reduce((acc, u) => {
            const result = HighlightUsers.cache[u];
            if (result) return { ...acc, [u]: result };
            return acc;
        }, {} as ResolvedUsers);
    },

    gatherCSS(users: ResolvedUsers, groups: HighlightGroup[]) {
        const cssRules: string[] = [];
        const usernames = Object.keys(users) || [];

        for (const user of usernames)
            for (const group of groups) {
                if (!group.enabled) continue;
                const { id, mod } = users[user]?.[0];
                const foundUser = group.users?.find((u) => u.toLowerCase() === user.toLowerCase());

                if (group.name === "Original Poster")
                    cssRules.push(`div.oneline.op span.oneline_user, .cs_thread_pane_reply_author.op { ${group.css} }`);
                else if (group.name === "Mods" && mod) {
                    const rules = [
                        `div.fpauthor_${id} span.author span.user>a`,
                        `div.chattypost__hdr.fpauthor_${id} span.username>a`,
                        `div.olauthor_${id} span.oneline_user`,
                        `.authorid_${id}, .replyid_${id}`,
                    ].join(", ");
                    cssRules.push(`${rules} { ${group.css} }`);
                } else if (foundUser && group.css.length > 0) {
                    const rules = [
                        `div.fpauthor_${id} span.author span.user>a`,
                        `div.chattypost__hdr.fpauthor_${id} span.username>a`,
                        `div.olauthor_${id} span.oneline_user`,
                        `.authorid_${id}, .replyid_${id}`,
                    ].join(", ");
                    cssRules.push(`${rules} { ${group.css} }`);
                }
            }

        // don't highlight current user as mod/employee/dev
        cssRules.push("span.this_user { color: rgb(0, 191, 243) !important; }");

        const css = cssRules.join(" ");
        insertStyle(css, "highlighted-users");
    },

    async applyFilter() {
        const is_enabled = await enabledContains(["highlight_users"]);
        if (is_enabled) {
            const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
            const users = HighlightUsers.resolveUsers();
            // we just need to run this once per page
            HighlightUsers.gatherCSS(users, groups);
        }
    },
};
