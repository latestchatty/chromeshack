settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("post_preview"))
    {
        PostPreview =
        {
            state: 0, // 0 = insert mode, 1 = preview mode

            install: function()
            {
                var postButton = document.getElementById("frm_submit");
                var form_body = document.getElementById("frm_body");
                if (postButton && form_body)
                {
                    // don't add click handlers here, because these elements get cloned into the page later
                    var previewButton = document.createElement("button");
                    previewButton.id = "previewButton";
                    previewButton.setAttribute("type", "button");
                    previewButton.innerHTML = "Preview";
                    if (getSetting("post_preview_location") == "Left")
                        postButton.parentNode.insertBefore(previewButton, postButton);
                    else
                        postButton.parentNode.insertBefore(previewButton, postButton.nextSibling);

                    var previewArea = document.createElement("div");
                    previewArea.id = "previewArea";
                    form_body.parentNode.insertBefore(previewArea, form_body);
                }
            },

            installClickEvent: function(postbox)
            {
                var previewButton = document.getElementById("previewButton");
                var previewArea = document.getElementById("previewArea");

                previewButton.addEventListener("click", PostPreview.togglePreview, true);
                if(getSetting("post_preview_live") === false)
                    previewArea.addEventListener("click", PostPreview.togglePreview, true);
            },

            togglePreview: function()
            {
                if (PostPreview.state == 0)
                    PostPreview.viewPreview();
                else
                    PostPreview.viewSource();
            },

            viewPreview: function()
            {
                var previewArea = document.getElementById("previewArea");
                var form_body = document.getElementById("frm_body");
                previewArea.innerHTML = generatePreview(form_body.value);
                previewArea.style.display = "block"; 
                if(getSetting("post_preview_live") === false) {
                    form_body.style.display = "none";
                } else {
                    form_body.addEventListener("input", PostPreview.updatePreview, true)
                }
                PostPreview.state = 1;
            },

            viewSource: function()
            {
                var form_body = document.getElementById("frm_body");
                if(getSetting("post_preview_live") === true) {
                    form_body.removeEventListener("input", PostPreview.updatePreview, true)
                }
                form_body.style.display = "block"; 
                document.getElementById("previewArea").style.display = "none"; 
                PostPreview.state = 0;
            },

            updatePreview: function()
            {
                document.getElementById("previewArea").innerHTML = generatePreview(document.getElementById("frm_body").value);
            }
        }

        PostPreview.install();
        processPostBoxEvent.addHandler(PostPreview.installClickEvent);
    }
});
