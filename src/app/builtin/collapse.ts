import { processPostEvent, processRefreshIntentEvent } from "../core/events";
import ChromeShack from "../core/observers";
import { getSetting } from "../core/settings";
import { elementMatches, locatePostRefs, objContains, collapseThread, unCollapseThread } from "../core/common";

const Collapse = {
    install() {
        processPostEvent.addHandler(Collapse.toggle);
    },

    collapseHandler(e) {
        let collapse = elementMatches(e.target, "a.closepost");
        let uncollapse = elementMatches(e.target, "a.showpost");
        if (collapse) {
            let { post, root } = locatePostRefs(collapse);
            let rootId = root && root.id.substr(5);
            if (ChromeShack.debugEvents) console.log("ran collapse handler:", rootId, collapse);
            Collapse.close(e, rootId);
        } else if (uncollapse) {
            let { post, root } = locatePostRefs(uncollapse);
            let rootId = root && root.id.substr(5);
            if (ChromeShack.debugEvents) console.log("ran uncollapse handler:", rootId, uncollapse);
            Collapse.show(e, rootId);
        }
    },

    toggle(post, id, is_root_post) {
        // only process for root posts
        if (post && is_root_post) {
            let root = post.closest("div.root");
            let close = post.querySelector("a.closepost");
            let show = post.querySelector("a.showpost");
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
            let { post, root } = locatePostRefs(e.target);
            let postId = post && post.id.substr(5);
            let rootId = root && root.id.substr(5);
            if (postId || rootId) {
                if (ChromeShack.debugEvents) console.log("refreshing root post after uncollapse:", post, root);
                processRefreshIntentEvent.raise(postId, rootId);
            }
        }
    },
};

export default Collapse;
