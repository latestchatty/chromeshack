import { elemMatches, locatePostRefs, timeOverThresh } from "../core/common";
import { collapsedPostEvent, processPostEvent, processRefreshIntentEvent } from "../core/events";
import { getSetting, setSetting } from "../core/settings";

export const Collapse = {
    // 18hr threshold
    timeout: 1000 * 60 * 60 * 18,
    collapsed: [] as CollapsedThread[],

    async install() {
        await Collapse.getCollapsed();
        processPostEvent.addHandler(Collapse.toggle);
    },

    async collapseHandler(e: MouseEvent) {
        const this_node = e.target as HTMLElement;
        const collapse = elemMatches(this_node, "a.closepost");
        const uncollapse = elemMatches(this_node, "a.showpost");
        const { rootid } = (await locatePostRefs(collapse)) || (await locatePostRefs(uncollapse)) || {};
        if (collapse && rootid) await Collapse.close(e, rootid);
        else if (uncollapse && rootid) await Collapse.show(e, rootid);
    },

    async getCollapsed() {
        const _arr = (await getSetting("collapsed_threads", [])) as CollapsedThread[];
        Collapse.collapsed = _arr;
        await Collapse.cullAfterCollapseTime();
    },
    async setCollapsed(arr: CollapsedThread[]) {
        await setSetting("collapsed_threads", arr);
        Collapse.collapsed = arr;
    },
    findCollapsed(id: number) {
        return Collapse.collapsed?.find((c) => c.threadid === id);
    },

    async cullAfterCollapseTime() {
        const filtered = Collapse.collapsed.filter((c) => !timeOverThresh(c.timestamp, Collapse.timeout));
        await Collapse.setCollapsed(filtered);
    },

    async toggle(args: PostEventArgs) {
        const { post, root, rootid, is_root } = args || {};
        // only process for root posts
        if (post && is_root) {
            const rootContainer = root.closest("div.root") as HTMLElement;
            const close = post.querySelector("a.closepost");
            const show = post.querySelector("a.showpost");
            document.addEventListener("click", Collapse.collapseHandler);
            // check if thread should be collapsed
            const found = Collapse.findCollapsed(rootid);
            if (found) {
                collapsedPostEvent.raise({ threadid: found.threadid, is_collapsed: true });
                rootContainer?.classList?.add("collapsed");
                close.setAttribute("class", "closepost hidden");
                show.setAttribute("class", "showpost");
            } else collapsedPostEvent.raise({ threadid: rootid, is_collapsed: false });
        }
    },

    async collapseThread(id: number) {
        const MAX_LENGTH = 100;
        if (!Collapse.findCollapsed(id)) {
            const _arr = [...Collapse.collapsed];
            _arr.unshift({ threadid: id, timestamp: Date.now() });
            // remove a bunch if it gets too big
            if (_arr.length > MAX_LENGTH * 1.25) _arr.splice(MAX_LENGTH);
            await Collapse.setCollapsed(_arr);
            collapsedPostEvent.raise({ threadid: id, is_collapsed: true });
        }
    },

    async unCollapseThread(id: number) {
        const filtered = Collapse.collapsed.filter((c) => c.threadid !== id);
        await Collapse.setCollapsed(filtered);
        collapsedPostEvent.raise({ threadid: id, is_collapsed: false });
    },

    async close(e: MouseEvent, id: number) {
        await Collapse.collapseThread(id);
    },

    async show(e: MouseEvent, id: number) {
        await Collapse.unCollapseThread(id);
        const this_node = e.target as HTMLElement;
        if (
            this_node?.parentNode?.querySelector(".closepost:not(.hidden)") &&
            elemMatches(this_node, ".showpost.hidden")
        ) {
            // feed the refresh-thread event handler when uncollapsing
            const args = await locatePostRefs(this_node);
            const { postid, rootid } = args || {};
            if (postid || rootid) processRefreshIntentEvent.raise(args);
        }
    },
};
