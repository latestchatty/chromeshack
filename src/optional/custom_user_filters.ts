import { getSetting, getEnabledSuboption, enabledContains } from "../core/settings";
import { processPostRefreshEvent } from "../core/events";
import { HU_Instance, TP_Instance } from "../content";
import { ResolvedUser } from "./highlight_users";

export const CustomUserFilters = {
    parsedUsers: [] as ResolvedUser[],

    rootPostCount: 0,

    async install() {
        const is_enabled = await enabledContains("custom_user_filters");
        if (is_enabled) {
            processPostRefreshEvent.addHandler(CustomUserFilters.applyFilter);
            CustomUserFilters.applyFilter();
        }
    },

    resolveUser(username: string) {
        // cache parsed page users locally (using HighlightUsers' resolver)
        if (CustomUserFilters.parsedUsers.length === 0) CustomUserFilters.parsedUsers = HU_Instance.resolveUsers();
        return CustomUserFilters.parsedUsers.filter((v) => v.name === username);
    },

    async removeOLsFromUserId(id: string) {
        let postElems: Element[];
        const hideFPs = await getEnabledSuboption("cuf_hide_fullposts");
        if (hideFPs) postElems = [...document.querySelectorAll(`div.olauthor_${id}, div.fpauthor_${id}`)];
        else postElems = [...document.querySelectorAll(`div.olauthor_${id}`)];
        for (const post of postElems || []) {
            const ol = post?.matches(".oneline") && post;
            const fp = hideFPs && post?.matches(".fullpost") && post;
            const root = fp && fp.closest(".root");
            if ((<HTMLElement>ol?.parentNode)?.matches("li")) {
                // remove all subreplies along with the matched post
                const matchedNode = ol?.parentNode;
                while (matchedNode?.firstChild) matchedNode?.removeChild(matchedNode?.firstChild);
            } else if (fp && root && CustomUserFilters.rootPostCount > 2) {
                // only remove root if we're in thread mode
                root?.parentNode?.removeChild(root);
            }
        }
    },

    async applyFilter() {
        const filteredUsers = (await getSetting("user_filters")) as string[];
        if (!filteredUsers || filteredUsers.length === 0) return;
        CustomUserFilters.rootPostCount = document.querySelector(".threads")?.childElementCount ?? 0;
        for (const filteredUser of filteredUsers) {
            for (const userMatch of CustomUserFilters.resolveUser(filteredUser) || []) {
                await CustomUserFilters.removeOLsFromUserId((userMatch as ResolvedUser).id);
            }
        }
        // refresh threadpane after removing posts to avoid unnecessary redraws
        if (TP_Instance.isEnabled) TP_Instance.apply();
    },
};
