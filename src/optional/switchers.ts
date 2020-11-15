import { domMeasure, domMutate } from "../core/common";
import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { HighlightUsers } from "./highlight_users";

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
            const resolvedUsers = await HighlightUsers.resolveUsers();
            const resolved = await Switchers.offenders.reduce(async (acc, offender) => {
                const _acc = await acc;
                await domMeasure(() => {
                    const user = resolvedUsers[offender.new]?.[0] || resolvedUsers[offender.old]?.[0];
                    const matchedOld = user && offender.old.toLowerCase() === user.username.toLowerCase();
                    const matchedNew = user && offender.new.toLowerCase() === user.username.toLowerCase();
                    if (matchedOld || matchedNew)
                        _acc.push({
                            id: user.id,
                            username: user.username,
                            matched: matchedNew ? offender.old : offender.new,
                        });
                });
                return _acc;
            }, Promise.resolve([] as SwitcherMatch[]));
            Switchers.resolved = resolved;
            return resolved;
        } else return Switchers.resolved;
    },

    async loadSwitchers(args: PostEventArgs) {
        const { post } = args || {};
        const is_enabled = await enabledContains(["switchers"]);
        if (is_enabled) {
            const offenderMutations = [] as Record<string, any>[];
            if (Switchers.resolved.length === 0) await Switchers.cacheSwitchers();
            for (const offender of Switchers.resolved || [])
                await domMeasure(() => {
                    const offenderOLs = [...post?.querySelectorAll(`div.olauthor_${offender.id}`)] as HTMLElement[];
                    const offenderFPs = [...post?.querySelectorAll(`div.fpauthor_${offender.id}`)] as HTMLElement[];
                    offenderMutations.push({
                        posts: [...offenderOLs, ...offenderFPs],
                        username: offender.username,
                        matched: offender.matched,
                    });
                });

            await domMutate(() => {
                for (const { posts, username, matched } of offenderMutations)
                    for (const post of posts) Switchers.rewritePost(post, username, matched);
            });
        }
    },

    rewritePost(post: HTMLElement, name: string, oldName: string) {
        const newName = `${name} - (${oldName})`;
        const span = post.querySelector("span.oneline_user");
        const alt_span = post.querySelector("span.user");
        const user_icons = post.querySelectorAll("img.chatty-user-icons");
        if (span) span.textContent = newName;
        else if (alt_span) alt_span.firstChild.textContent = newName;
        // Switchers don't deserve flair icons
        for (const icon of user_icons || []) if (!icon.classList?.contains("hidden")) icon.classList?.add("hidden");
    },
};
