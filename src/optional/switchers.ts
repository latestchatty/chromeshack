import { HU_Instance } from "../content";
import { PostEventArgs } from "../core";
import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { ResolvedUser } from "./highlight_users";

/**
 * Created by wzutz on 12/9/13.
 */

interface SwitcherMatch extends ResolvedUser {
    matched: string;
}

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
        const is_enabled = await enabledContains(["switchers"]);
        if (is_enabled) {
            Switchers.cacheSwitchers();
            processPostEvent.addHandler(Switchers.loadSwitchers);
        }
    },

    cacheSwitchers() {
        // resolve and cache all offenders on the page once on load
        const resolvedUsers = HU_Instance.resolveUsers();
        for (const offender of Switchers.offenders) {
            const user = resolvedUsers[offender.new]?.[0] || resolvedUsers[offender.old]?.[0];
            if (!user) continue;
            const matchedOld = offender.old.toLowerCase() === user.username.toLowerCase();
            const matchedNew = offender.new.toLowerCase() === user.username.toLowerCase();
            if (matchedOld || matchedNew)
                Switchers.resolved = [
                    ...Switchers.resolved,
                    {
                        id: user.id,
                        username: user.username,
                        matched: matchedNew ? offender.old : offender.new,
                    } as SwitcherMatch,
                ];
        }
    },

    loadSwitchers({ post }: PostEventArgs) {
        for (const offender of Switchers.resolved || []) {
            const offenderOLs = [...post?.querySelectorAll(`div.olauthor_${offender.id}`)] as HTMLElement[];
            const offenderFPs = [...post?.querySelectorAll(`div.fpauthor_${offender.id}`)] as HTMLElement[];
            const offenderPosts = [...offenderOLs, ...offenderFPs];
            for (const post of offenderPosts) Switchers.rewritePost(post, offender.username, offender.matched);
        }
    },

    rewritePost(post: HTMLElement, name: string, oldName: string) {
        const newName = `${name} - (${oldName})`;
        const span = post.querySelector("span.oneline_user");
        const alt_span = post.querySelector("span.user");
        if (span) span.textContent = newName;
        else if (alt_span) alt_span.firstChild.textContent = newName;
        // Switchers don't deserve flair icons
        const user_icons = post.querySelectorAll("img.chatty-user-icons");
        for (const icon of user_icons || []) icon.setAttribute("style", "display: none !important;");
    },
};
