let PostPreview = {
    state: 0, // 0 = insert mode, 1 = preview mode

    previewTimer: null,

    install() {
        // script is already injected
        if (document.getElementById("previewButton") != null) return;

        let postButton = document.getElementById("frm_submit");
        let form_body = document.getElementById("frm_body");
        if (postButton && form_body) {
            // don't add click handlers here, because these elements get cloned into the page later
            let previewButton = document.createElement("button");
            previewButton.id = "previewButton";
            previewButton.setAttribute("type", "button");
            previewButton.textContent = "Preview";
            getSetting("post_preview_location").then(position => {
                postButton.parentNode.insertBefore(previewButton, postButton.nextSibling);
                let previewArea = document.createElement("div");
                previewArea.id = "previewArea";
                previewArea.style.display = "none";
                form_body.parentNode.insertBefore(previewArea, form_body);
            });
        }
    },

    installClickEvent() {
        let previewButton = document.getElementById("previewButton");
        let clickableTags = [...document.querySelectorAll("#shacktags_legend_table td > a")];
        previewButton.addEventListener("click", PostPreview.togglePreview, true);
        // include interactive tags legend as well
        for (let t of clickableTags || []) {
            t.addEventListener("click", () => {
                if (PostPreview.state === 1) {
                    // only update preview if shown
                    PostPreview.updatePreview();
                }
            }, true);
        }
    },

    togglePreview() {
        if (PostPreview.state == 0) {
            PostPreview.state = 1;
            PostPreview.enablePreview();
        } else {
            PostPreview.state = 0;
            PostPreview.disablePreview();
        }
    },

    enablePreview() {
        let form_body = document.getElementById("frm_body");
        let preview_box = document.getElementById("previewArea");
        preview_box.style.display = "block";
        PostPreview.updatePreview();
        form_body.addEventListener("keyup", PostPreview.updatePreview, true);
        form_body.focus();
    },

    disablePreview() {
        let form_body = document.getElementById("frm_body");
        let preview_box = document.getElementById("previewArea");
        preview_box.style.display = "none";
        form_body.removeEventListener("keyup", PostPreview.updatePreview, true);
        form_body.focus();
    },

    updatePreview() {
        if (PostPreview.previewTimer) clearTimeout(PostPreview.previewTimer);
        PostPreview.previewTimer = setTimeout(PostPreview.delayedPreview, 250);
    },

    delayedPreview() {
        let form_body = document.getElementById("frm_body");
        let previewArea = document.getElementById("previewArea");
        safeInnerHTML(generatePreview(form_body.value), previewArea);
    },
};

addDeferredHandler(enabledContains("post_preview"), res => {
    if (res) {
        PostPreview.install();
        processPostBoxEvent.addHandler(PostPreview.installClickEvent);
    }
});
