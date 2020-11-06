import fastdom from "fastdom";
import { elemMatches, locatePostRefs } from "../core/common";
import { collapsedPostEvent, processPostEvent, processRefreshIntentEvent } from "../core/events";
import { PostEventArgs } from "../core/events.d";
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
        return foundIdx > -1 ? { idx: foundIdx, collapsed } : null;
    },

    async cullAfterCollapseTime() {
        const maxTime = 1000 * 60 * 60 * 18; // 18hr limit
        const curTime = Date.now();
        const lastCollapseTime = (await getSetting("last_collapse_time", -1)) as number;
        const diffTime = Math.abs(curTime - lastCollapseTime);
        if (lastCollapseTime > -1 && diffTime > maxTime) {
            await setSetting("last_collapse_time", curTime);
            await setSetting("collapsed_threads", []);
        }
    },

    async toggle({ post, root, rootid, is_root }: PostEventArgs) {
        // only process for root posts
        if (post && is_root) {
            const rootContainer = root.closest("div.root") as HTMLElement;
            const close = post.querySelector("a.closepost");
            const show = post.querySelector("a.showpost");
            await Collapse.cullAfterCollapseTime();
            document.addEventListener("click", Collapse.collapseHandler);
            // check if thread should be collapsed
            fastdom.mutate(async () => {
                const { idx } = (await Collapse.findCollapsed(rootid.toString())) || {};
                if (idx > -1) {
                    collapsedPostEvent.raise({ threadid: rootid, is_collapsed: true });
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
                collapsedPostEvent.raise({ threadid: id, is_collapsed: true });
            }
        });
    },

    unCollapseThread(id: number) {
        Collapse.findCollapsed(id.toString()).then(({ idx, collapsed }) => {
            if (idx > -1) {
                collapsed.splice(idx, 1);
                setSetting("collapsed_threads", collapsed);
                collapsedPostEvent.raise({ threadid: id, is_collapsed: false });
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
