import { CS_Instance } from "../content";
import { processPostEvent, processRefreshIntentEvent } from "../core/events";
import { getSetting, setSetting } from "../core/settings";
import { elemMatches, locatePostRefs, objContains } from "../core/common";

const Collapse = {
    install() {
        processPostEvent.addHandler(Collapse.toggle);
    },

    collapseHandler(e: MouseEvent) {
        const this_node = e.target as HTMLElement;
        const collapse = elemMatches(this_node, "a.closepost");
        const uncollapse = elemMatches(this_node, "a.showpost");
        const { rootid } = locatePostRefs(collapse) || locatePostRefs(uncollapse) || {};
        if (collapse && rootid) {
            if (CS_Instance.debugEvents) console.log("ran collapse handler:", rootid, collapse);
            Collapse.close(e, rootid);
        } else if (uncollapse && rootid) {
            if (CS_Instance.debugEvents) console.log("ran uncollapse handler:", rootid, uncollapse);
            Collapse.show(e, rootid);
        }
    },

    toggle(post: HTMLElement, id: string, is_root_post: boolean) {
        // only process for root posts
        if (post && is_root_post) {
            const rootContainer = post.closest("div.root") as HTMLElement;
            const close = post.querySelector("a.closepost");
            const show = post.querySelector("a.showpost");
            document.addEventListener("click", Collapse.collapseHandler);
            // check if thread should be collapsed
            getSetting("collapsed_threads").then((collapsed) => {
                const contained = objContains(id, collapsed as string[]);
                if (contained) {
                    rootContainer?.classList?.add("collapsed");
                    close.setAttribute("class", "closepost hidden");
                    show.setAttribute("class", "showpost");
                }
            });
        }
    },

    collapseThread(id: string) {
        const MAX_LENGTH = 100;
        getSetting("collapsed_threads", []).then((collapsed: string[]) => {
            if (collapsed.indexOf(id) < 0) {
                collapsed.unshift(id);
                // remove a bunch if it gets too big
                if (collapsed.length > MAX_LENGTH * 1.25) collapsed.splice(MAX_LENGTH);
                setSetting("collapsed_threads", collapsed);
            }
        });
    },

    unCollapseThread(id: string) {
        getSetting("collapsed_threads", []).then((collapsed: string[]) => {
            const index = collapsed.indexOf(id);
            if (index >= 0) {
                collapsed.splice(index, 1);
                setSetting("collapsed_threads", collapsed);
            }
        });
    },

    close(e: MouseEvent, id: string) {
        Collapse.collapseThread(id);
    },

    show(e: MouseEvent, id: string) {
        Collapse.unCollapseThread(id);
        const this_node = e.target as HTMLElement;
        if (
            this_node.parentNode.querySelector(".closepost:not(.hidden)") &&
            elemMatches(this_node, ".showpost.hidden")
        ) {
            // feed the refresh-thread event handler when uncollapsing
            const { post, postid, root, rootid } = locatePostRefs(this_node);
            if (postid || rootid) {
                if (CS_Instance.debugEvents) console.log("refreshing root post after uncollapse:", post, root);
                processRefreshIntentEvent.raise(post, root, postid, rootid);
            }
        }
    },
};

export default Collapse;
