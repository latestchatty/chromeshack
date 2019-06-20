settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("post_preview"))
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

                    PostPreview.togglePreview(); // show if enabled
                }
            },

            installClickEvent: function()
            {
                var previewButton = document.getElementById("previewButton");
                var form_body = document.getElementById("frm_body");

                previewButton.addEventListener("click", PostPreview.togglePreview, true);
                if (getSetting("post_preview_live") === true)
                    form_body.addEventListener("input", PostPreview.updatePreview, true);
            },

            togglePreview: function()
            {
                if (PostPreview.state == 0) {
                    document.getElementById("previewArea").style.display = "block";
                    PostPreview.state = 1;
                    PostPreview.viewPreview();
                }
                else {
                    document.getElementById("previewArea").style.display = "none";
                    PostPreview.state = 0;
                    PostPreview.viewSource();
                }
            },

            viewPreview: function()
            {
                var form_body = document.getElementById("frm_body");
                PostPreview.updatePreview();
                if (getSetting("post_preview_live") === false)
                    form_body.style.display = "none";
                else
                    form_body.addEventListener("input", PostPreview.updatePreview, true);
            },

            viewSource: function()
            {
                if (getSetting("post_preview_live") === true)
                    document.getElementById("frm_body").removeEventListener("input", PostPreview.updatePreview, true)
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
