import { HU_Instance } from "../content";
import { processPostRefreshEvent, userFilterUpdateEvent } from "../core/events";
import { enabledContains, getEnabledSuboption, getSetting } from "../core/settings";
import { ResolvedUser } from "./highlight_users";

export const CustomUserFilters = {
    parsedUsers: [] as ResolvedUser[],

    rootPostCount: 0,

    async install() {
        const is_enabled = await enabledContains(["custom_user_filters"]);
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

    async removeOLsFromUserId(id: string, user: string) {
        let postElems: Element[];
        const isChatty = document.getElementById("newcommentbutton");
        const hideFPs = await getEnabledSuboption("cuf_hide_fullposts");
        if (hideFPs) postElems = [...document.querySelectorAll(`div.olauthor_${id}, div.fpauthor_${id}`)];
        else postElems = [...document.querySelectorAll(`div.olauthor_${id}`)];
        for (const post of postElems || []) {
            const ol = post?.matches(".oneline") && post;
            const fp = hideFPs && post?.matches(".fullpost") && post;
            const root = fp && fp.closest(".root");
            if ((<HTMLElement>ol?.parentNode)?.matches("li")) {
                // remove all matching subreplies
                const matchedNode = ol?.parentNode;
                const children = matchedNode?.childNodes;
                let lastChild = children?.[children.length - 1] as HTMLElement;
                let lastChildIsRoot = lastChild?.matches && lastChild.matches(".root>ul>li>.fullpost");
                for (let i = children.length - 1; i > 0 && lastChild; i--) {
                    // don't remove the root fullpost in single-thread mode
                    if ((hideFPs && !isChatty && !lastChildIsRoot) || (!lastChildIsRoot && lastChild))
                        matchedNode.removeChild(lastChild);
                    lastChild = children[i - 1] as HTMLElement;
                    lastChildIsRoot = lastChild?.matches && lastChild.matches(".root>ul>li>.fullpost");
                }
            } else if (isChatty && fp && root)
                // only remove root if we're in thread mode
                root?.parentNode?.removeChild(root);
        }
        userFilterUpdateEvent.raise(user);
    },

    async applyFilter() {
        const filteredUsers = (await getSetting("user_filters")) as string[];
        if (!filteredUsers || filteredUsers.length === 0) return;
        CustomUserFilters.rootPostCount = document.querySelector(".threads")?.childElementCount ?? 0;
        for (const filteredUser of filteredUsers)
            for (const userMatch of CustomUserFilters.resolveUser(filteredUser) || [])
                await CustomUserFilters.removeOLsFromUserId((userMatch as ResolvedUser).id, userMatch.name);
    },
};
