import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { HU_Instance } from "../content";

/**
 * Created by wzutz on 12/9/13.
 */

const Switchers = {
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

    resolved: [],

    async install() {
        return enabledContains("switchers").then((res) => {
            if (res) {
                Switchers.cacheSwitchers();
                processPostEvent.addHandler(Switchers.loadSwitchers);
            }
        });
    },

    cacheSwitchers() {
        // resolve and cache all offenders on the page once on load
        let users = HU_Instance.resolveUsers();
        for (let user of users || []) {
            for (let offender of Switchers.offenders) {
                let matchedOld = offender.old.toLowerCase() === user.name.toLowerCase();
                let matchedNew = offender.new.toLowerCase() === user.name.toLowerCase();
                if (matchedOld || matchedNew) {
                    Switchers.resolved = [
                        ...Switchers.resolved,
                        {
                            id: user.id,
                            name: user.name,
                            matched: matchedNew ? offender.old : offender.new,
                        },
                    ];
                }
            }
        }
    },

    loadSwitchers(item) {
        for (let offender of Switchers.resolved || []) {
            let offenderOLs = [...item.querySelectorAll(`div.olauthor_${offender.id}`)];
            let offenderFPs = [...item.querySelectorAll(`div.fpauthor_${offender.id}`)];
            let offenderPosts = [...offenderOLs, ...offenderFPs];
            for (let post of offenderPosts) Switchers.rewritePost(post, offender.name, offender.matched);
        }
    },

    rewritePost(post, name, oldName) {
        let newName = `${name} - (${oldName})`;
        let span = post.querySelector("span.oneline_user");
        let alt_span = post.querySelector("span.user");
        if (span) span.textContent = newName;
        else if (alt_span) alt_span.firstChild.textContent = newName;
        // Switchers don't deserve flair icons
        let user_icons = post.querySelectorAll("img.chatty-user-icons");
        for (let icon of user_icons || []) icon.setAttribute("style", "display: none !important;");
    },
};

export default Switchers;
