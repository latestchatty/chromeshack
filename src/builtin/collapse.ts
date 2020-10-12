import { PostEventArgs } from "../core";
import { elemMatches, locatePostRefs } from "../core/common";
import { processPostEvent, processRefreshIntentEvent } from "../core/events";
import { getSetting, setSetting } from "../core/settings";

export const Collapse = {
    install() {
        processPostEvent.addHandler(Collapse.toggle);
    },

    collapseHandler(e: MouseEvent) {
        const this_node = e.target as HTMLElement;
        const collapse = elemMatches(this_node, "a.closepost");
        const uncollapse = elemMatches(this_node, "a.showpost");
        const { rootid } = locatePostRefs(collapse) || locatePostRefs(uncollapse) || {};
        if (collapse && rootid) Collapse.close(e, rootid);
        else if (uncollapse && rootid) Collapse.show(e, rootid);
    },

    async findCollapsed(id: string) {
        const collapsed = (await getSetting("collapsed_threads")) as string[];
        const foundIdx = collapsed?.findIndex((c) => c === id);
        return { idx: foundIdx, collapsed };
    },

    toggle({ post, root, rootid, is_root }: PostEventArgs) {
        // only process for root posts
        if (post && is_root) {
            const rootContainer = root.closest("div.root") as HTMLElement;
            const close = post.querySelector("a.closepost");
            const show = post.querySelector("a.showpost");
            document.addEventListener("click", Collapse.collapseHandler);
            // check if thread should be collapsed
            Collapse.findCollapsed(rootid.toString()).then(({ idx }) => {
                if (idx > -1) {
                    rootContainer?.classList?.add("collapsed");
                    close.setAttribute("class", "closepost hidden");
                    show.setAttribute("class", "showpost");
                }
            });
        }
    },

    collapseThread(id: number) {
        const MAX_LENGTH = 100;
        const _id = id.toString();
        Collapse.findCollapsed(_id).then(({ idx, collapsed }) => {
            if (idx === -1) {
                collapsed.unshift(_id);
                // remove a bunch if it gets too big
                if (collapsed.length > MAX_LENGTH * 1.25) collapsed.splice(MAX_LENGTH);
                setSetting("collapsed_threads", collapsed);
            }
        });
    },

    unCollapseThread(id: number) {
        Collapse.findCollapsed(id.toString()).then(({ idx, collapsed }) => {
            if (idx > -1) {
                collapsed.splice(idx, 1);
                setSetting("collapsed_threads", collapsed);
            }
        });
    },

    close(e: MouseEvent, id: number) {
        Collapse.collapseThread(id);
    },

    show(e: MouseEvent, id: number) {
        Collapse.unCollapseThread(id);
        const this_node = e.target as HTMLElement;
        if (
            this_node?.parentNode?.querySelector(".closepost:not(.hidden)") &&
            elemMatches(this_node, ".showpost.hidden")
        ) {
            // feed the refresh-thread event handler when uncollapsing
            const args = locatePostRefs(this_node);
            const { postid, rootid } = args || {};
            if (postid || rootid) processRefreshIntentEvent.raise(args);
        }
    },
};
