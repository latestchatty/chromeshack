import { processPostRefreshEvent, userFilterUpdateEvent } from "../core/events";
import { enabledContains, getEnabledSuboption, getSetting } from "../core/settings";
import { HighlightUsers } from "./highlight_users";

export const CustomUserFilters = {
  rootPostCount: 0,

  async install() {
    await CustomUserFilters.applyFilter();
    processPostRefreshEvent.addHandler(CustomUserFilters.applyFilter);
  },

  async removeOLsForAuthorId({ id }: ResolvedUser, hideFPs: boolean) {
    let postElems: Element[];
    const isChatty = document.getElementById("newcommentbutton");
    if (hideFPs) postElems = [...document.querySelectorAll(`div.olauthor_${id}, div.fpauthor_${id}`)];
    else postElems = [...document.querySelectorAll(`div.olauthor_${id}`)];
    for (const post of postElems || []) {
      const ol = post?.matches(".oneline") && (post as HTMLElement);
      const fp = hideFPs && post?.matches(".fullpost") && post;
      // biome-ignore lint/complexity/useOptionalChain: "necessary for op filter"
      const root = fp && fp.closest(".root");
      if (ol?.parentElement?.matches("li")) {
        // remove all matching subreplies
        const matchedNode = ol?.parentNode;
        const children = matchedNode?.childNodes;
        let lastChild = children?.[children.length - 1] as HTMLElement;
        let lastChildIsRoot =
          // biome-ignore lint/complexity/useOptionalChain: "necessary for op filter"
          lastChild?.matches && lastChild.matches(".root>ul>li>.fullpost");
        for (let i = children.length - 1; i > 0 && lastChild; i--) {
          // don't remove the root fullpost in single-thread mode
          if ((hideFPs && !isChatty && !lastChildIsRoot) || (!lastChildIsRoot && lastChild))
            matchedNode.removeChild(lastChild);

          lastChild = children[i - 1] as HTMLElement;
          lastChildIsRoot =
            // biome-ignore lint/complexity/useOptionalChain: "necessary for op filter"
            lastChild?.matches && lastChild.matches(".root>ul>li>.fullpost");
        }
      } else if (isChatty && fp && root)
        // only remove root if we're in thread mode
        root?.parentElement?.removeChild(root);
    }
  },

  async applyFilter() {
    const is_enabled = await enabledContains(["custom_user_filters"]);
    if (is_enabled) {
      const filteredUsers = (await getSetting("user_filters")) as string[];
      if (!filteredUsers || filteredUsers.length === 0) return;
      CustomUserFilters.rootPostCount = document.querySelector(".threads")?.childElementCount ?? 0;
      const hideFPs = !!(await getEnabledSuboption("cuf_hide_fullposts"));
      const resolved = HighlightUsers.resolveUser(filteredUsers);
      for (const records of Object.values(resolved) || [])
        for (const record of records || []) {
          userFilterUpdateEvent.raise(record);
          await CustomUserFilters.removeOLsForAuthorId(record, hideFPs);
        }
    }
  },
};
