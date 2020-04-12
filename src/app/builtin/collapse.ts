import { processPostEvent, processRefreshIntentEvent } from "../core/events";
import ChromeShack from "../core/observers";
import { getSetting } from "../core/settings";
import { elementMatches, locatePostRefs, objContains, collapseThread, unCollapseThread } from "../core/common";

const Collapse = {
    install() {
        processPostEvent.addHandler(Collapse.toggle);
    },

    collapseHandler(e) {
        const collapse = elementMatches(e.target, "a.closepost");
        const uncollapse = elementMatches(e.target, "a.showpost");
        if (collapse) {
            const { post, root } = locatePostRefs(collapse);
            const rootId = root && root.id.substr(5);
            if (ChromeShack.debugEvents) console.log("ran collapse handler:", rootId, collapse);
            Collapse.close(e, rootId);
        } else if (uncollapse) {
            const { post, root } = locatePostRefs(uncollapse);
            const rootId = root && root.id.substr(5);
            if (ChromeShack.debugEvents) console.log("ran uncollapse handler:", rootId, uncollapse);
            Collapse.show(e, rootId);
        }
    },

    toggle(post, id, is_root_post) {
        // only process for root posts
        if (post && is_root_post) {
            const root = post.closest("div.root");
            const close = post.querySelector("a.closepost");
            const show = post.querySelector("a.showpost");
            document.addEventListener("click", Collapse.collapseHandler);
            // check if thread should be collapsed
            getSetting("collapsed_threads").then((collapsed) => {
                if (objContains(id, collapsed)) {
                    root.classList.add("collapsed");
                    close.setAttribute("class", "closepost hidden");
                    show.setAttribute("class", "showpost");
                }
            });
        }
    },

    close(e, id) {
        collapseThread(id);
    },

    show(e, id) {
        unCollapseThread(id);
        if (e.target.parentNode.querySelector(".closepost:not(.hidden)") && e.target.matches(".showpost.hidden")) {
            // feed the refresh-thread event handler when uncollapsing
            const { post, root } = locatePostRefs(e.target);
            const postId = post && post.id.substr(5);
            const rootId = root && root.id.substr(5);
            if (postId || rootId) {
                if (ChromeShack.debugEvents) console.log("refreshing root post after uncollapse:", post, root);
                processRefreshIntentEvent.raise(postId, rootId);
            }
        }
    },
};

export default Collapse;
