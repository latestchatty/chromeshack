import { HU_Instance } from "../content";
import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";

/**
 * Created by wzutz on 12/9/13.
 */
export const Switchers = {
    offenders: [
        { old: "gegtik", new: "boring gegtik" },
        { old: "thaperfectdrug", new: "Dave-A" },
        { old: "MagicWishMonkey", new: "MaximDiscord" },
        { old: "timaste", new: "timmytaste" },
        { old: "The Grolar Bear", new: "The Gorilla Bear" },
        { old: "jingletard", new: "Jingletardigrade" },
        { old: "ArB", new: "jingleArB" },
        { old: "Rigor Morts", new: "dewhickey" },
    ],

    resolved: [] as SwitcherMatch[],

    async install() {
        await Switchers.cacheSwitchers();
        processPostEvent.addHandler(Switchers.loadSwitchers);
    },

    async cacheSwitchers() {
        const is_enabled = await enabledContains(["switchers"]);
        if (is_enabled && Switchers.resolved.length === 0) {
            // resolve and cache all offenders on the page once on load
            const resolvedUsers = await HU_Instance.resolveUsers();
            const resolved = [] as SwitcherMatch[];
            for (const of of Switchers.offenders || []) {
                const user = resolvedUsers[of.new]?.[0] || resolvedUsers[of.old]?.[0];
                const matchedOld = user && of.old.toLowerCase() === user.username.toLowerCase();
                const matchedNew = user && of.new.toLowerCase() === user.username.toLowerCase();
                if (matchedOld || matchedNew)
                    resolved.push({
                        id: user.id,
                        username: user.username,
                        matched: matchedNew ? of.old : of.new,
                    } as SwitcherMatch);
            }
            Switchers.resolved = resolved;
            return resolved;
        } else return Switchers.resolved;
    },

    async loadSwitchers(args: PostEventArgs) {
        const { post } = args || {};
        const is_enabled = await enabledContains(["switchers"]);
        if (is_enabled) {
            const offenderMutations = [] as Record<string, any>[];
            await Switchers.cacheSwitchers();
            for (const offender of Switchers.resolved || []) {
                const offenderOLs = [...post?.querySelectorAll(`div.olauthor_${offender.id}`)] as HTMLElement[];
                const offenderFPs = [...post?.querySelectorAll(`div.fpauthor_${offender.id}`)] as HTMLElement[];
                offenderMutations.push({
                    posts: [...offenderOLs, ...offenderFPs],
                    username: offender.username,
                    matched: offender.matched,
                });
            }
            for (const { posts, username, matched } of offenderMutations)
                for (const post of posts) Switchers.rewritePost(post, username, matched);
        }
    },

    rewritePost(post: HTMLElement, name: string, oldName: string) {
        const newName = `${name} - (${oldName})`;
        const span = post.querySelector("span.oneline_user");
        const alt_span = post.querySelector("span.user");
        const user_icons = post.querySelectorAll("img.chatty-user-icons");
        // Switchers don't deserve flair icons
        if (span) span.textContent = newName;
        else if (alt_span) alt_span.firstChild.textContent = newName;
        for (const icon of user_icons || []) icon.setAttribute("style", "display: none !important;");
    },
};
