import { HU_Instance } from "../content";
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
        const is_enabled = await enabledContains("switchers");
        if (is_enabled) {
            Switchers.cacheSwitchers();
            processPostEvent.addHandler(Switchers.loadSwitchers);
        }
    },

    cacheSwitchers() {
        // resolve and cache all offenders on the page once on load
        const users = HU_Instance.resolveUsers();
        for (const user of users || [])
            for (const offender of Switchers.offenders) {
                const matchedOld = offender.old.toLowerCase() === user.name.toLowerCase();
                const matchedNew = offender.new.toLowerCase() === user.name.toLowerCase();
                if (matchedOld || matchedNew)
                    Switchers.resolved = [
                        ...Switchers.resolved,
                        {
                            id: user.id,
                            name: user.name,
                            matched: matchedNew ? offender.old : offender.new,
                        } as SwitcherMatch,
                    ];
            }
    },

    loadSwitchers(item: HTMLElement) {
        for (const offender of Switchers.resolved || []) {
            const offenderOLs = [...item.querySelectorAll(`div.olauthor_${offender.id}`)];
            const offenderFPs = [...item.querySelectorAll(`div.fpauthor_${offender.id}`)];
            const offenderPosts = [...offenderOLs, ...offenderFPs];
            for (const post of offenderPosts)
                Switchers.rewritePost(post as HTMLElement, offender.name, offender.matched);
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
