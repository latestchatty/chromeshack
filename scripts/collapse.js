let Collapse = {
    toggle(item, id, is_root_post) {
        // only process for root posts
        if (is_root_post) {
            let root = document.getElementById(`root_${id}`);
            // root should never be null, but check anyway
            if (root) {
                let postmeta = item.querySelector("div.postmeta");
                let close = postmeta.querySelector("a.closepost");
                let show = postmeta.querySelector("a.showpost");
                close.addEventListener("click", (e) => {
                    Collapse.close(e, id);
                });
                show.addEventListener("click", (e) => {
                    Collapse.show(e, id);
                });

                // this thread should be collapsed
                getSetting("collapsed_threads").then(collapsed => {
                    if (objContains(id, collapsed)) {
                        root.classList.add("collapsed");
                        show.setAttribute("class", "showpost");
                        close.setAttribute("class", "closepost hidden");
                    }
                });
            }
        }
    },

    close(e, id) {
        collapseThread(id);
    },

    show(e, id) {
        unCollapseThread(id);
        if (e.target.parentNode.querySelector(".closepost:not(.hidden)") &&
            e.target.matches(".showpost.hidden")) {
                // feed the refresh-thread event handler when uncollapsing
                let post = e.target.closest("li[id^='item_']");
                let root = e.target.closest(".root > ul > li");
                if (post) ChromeShack.processRefresh(post, root, true);
            }
    }
};

processPostEvent.addHandler(Collapse.toggle)
