settingsLoadedEvent.addHandler(function()
{
    if (objContains("post_preview", getSetting("enabled_scripts")))
    {
        PostPreview =
        {
            state: 0, // 0 = insert mode, 1 = preview mode

            install: function()
            {
                // script is already injected
                if (document.getElementById("previewButton") != null)
                    return;

                var postButton = document.getElementById("frm_submit");
                var form_body = document.getElementById("frm_body");
                if (postButton && form_body)
                {
                    // don't add click handlers here, because these elements get cloned into the page later
                    var previewButton = document.createElement("button");
                    previewButton.id = "previewButton";
                    previewButton.setAttribute("type", "button");
                    previewButton.textContent = "Preview";
                    if (getSetting("post_preview_location") == "Left")
                        postButton.parentNode.insertBefore(previewButton, postButton);
                    else
                        postButton.parentNode.insertBefore(previewButton, postButton.nextSibling);

                    var previewArea = document.createElement("div");
                    previewArea.id = "previewArea";
                    previewArea.style.display = "none";
                    form_body.parentNode.insertBefore(previewArea, form_body);
                }
            },

            installClickEvent: function()
            {
                var previewButton = document.getElementById("previewButton");
                previewButton.addEventListener("click", PostPreview.togglePreview, true);
            },

            togglePreview: function()
            {
                if (PostPreview.state == 0) {
                    PostPreview.state = 1;
                    PostPreview.enablePreview();
                }
                else {
                    PostPreview.state = 0;
                    PostPreview.disablePreview();
                }
            },

            enablePreview: function()
            {
                var form_body = document.getElementById("frm_body");
                var preview_box = document.getElementById("previewArea");
                preview_box.style.display = "block";
                PostPreview.updatePreview();
                if (getSetting("post_preview_live") === true)
                    form_body.addEventListener("input", PostPreview.updatePreview, true);
                form_body.focus();
            },

            disablePreview: function()
            {
                var form_body = document.getElementById("frm_body");
                var preview_box = document.getElementById("previewArea");
                preview_box.style.display = "none";
                if (getSetting("post_preview_live") === true)
                    form_body.removeEventListener("input", PostPreview.updatePreview, true)
                form_body.focus();
            },

            updatePreview: function()
            {
                var form_body = document.getElementById("frm_body");
                var previewArea = document.getElementById("previewArea");
                safeInnerHTML(generatePreview(form_body.value), previewArea);
            }
        }

        PostPreview.install();
        processPostBoxEvent.addHandler(PostPreview.installClickEvent);
    }
});
