import { getSetting, getEnabledSuboptions, enabledContains } from "../core/settings";
import { processPostRefreshEvent } from "../core/events";
import { HU_Instance } from "../content";
import ThreadPane from "./thread_pane";

const CustomUserFilters = {
    parsedUsers: [],

    rootPostCount: 0,

    async install() {
        return enabledContains("custom_user_filters").then((res) => {
            if (res) {
                processPostRefreshEvent.addHandler(CustomUserFilters.applyFilter);
                CustomUserFilters.applyFilter();
            }
        });
    },

    resolveUser(username) {
        // cache parsed page users locally (using HighlightUsers' resolver)
        if (CustomUserFilters.parsedUsers.length === 0) CustomUserFilters.parsedUsers = HU_Instance.resolveUsers();
        return CustomUserFilters.parsedUsers.filter((v) => v.name === username);
    },

    async removeOLsFromUserId(id) {
        let postElems;
        let hideFPs = await getEnabledSuboptions("cuf_hide_fullposts");
        if (hideFPs) postElems = [...document.querySelectorAll(`div.olauthor_${id}, div.fpauthor_${id}`)];
        else postElems = [...document.querySelectorAll(`div.olauthor_${id}`)];
        for (let post of postElems || []) {
            let ol = post.matches(".oneline") && post;
            let fp = hideFPs && post.matches(".fullpost") && post;
            let root = fp && fp.closest(".root");
            if (ol && ol.parentNode.matches("li")) {
                // remove all subreplies along with the matched post
                let matchedNode = ol.parentNode;
                while (matchedNode.firstChild) matchedNode.removeChild(matchedNode.firstChild);
            } else if (fp && root && CustomUserFilters.rootPostCount > 2) {
                // only remove root if we're in thread mode
                root.parentNode.removeChild(root);
            }
        }
    },

    applyFilter() {
        getSetting("user_filters").then(async (filteredUsers) => {
            if (!filteredUsers || filteredUsers.length === 0) return;
            CustomUserFilters.rootPostCount = document.querySelector(".threads").childElementCount;
            let hasMatched;
            for (let filteredUser of filteredUsers) {
                for (let userMatch of CustomUserFilters.resolveUser(filteredUser) || []) {
                    await CustomUserFilters.removeOLsFromUserId(userMatch.id);
                    hasMatched = userMatch;
                }
            }
            // refresh threadpane after removing posts to avoid unnecessary redraws
            if (hasMatched && hasMatched.length > 0) ThreadPane.install(); // don't forget to update the thread pane
        });
    },
};

export default CustomUserFilters;
