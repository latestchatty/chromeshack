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
                previewArea.innerHTML = PostPreview.generatePreview(form_body.value);
                previewArea.style.display = "block"; 
                form_body.style.display = "none"; 
                PostPreview.state = 1;
            },

            viewSource: function()
            {
                document.getElementById("frm_body").style.display = "block"; 
                document.getElementById("previewArea").style.display = "none"; 
                PostPreview.state = 0;
            },

            generatePreview: function(text)
            {
                var preview = text;

                var regexReplacements = {
                    '<': '&lt;',
                    '>': '&gt;',
                    'r{(.*)}r': '<span class="jt_red">$1</span>',
                    'g{(.*)}g': '<span class="jt_green">$1</span>',
                    'b{(.*)}b': '<span class="jt_blue">$1</span>',
                    'y{(.*)}y': '<span class="jt_yellow">$1</span>',
                    'e\\[(.*)\\]e': '<span class="jt_olive">$1</span>',
                    'l\\[(.*)\\]l': '<span class="jt_lime">$1</span>',
                    'n\\[(.*)\\]n': '<span class="jt_orange">$1</span>',
                    'p\\[(.*)\\]p': '<span class="jt_pink">$1</span>',
                    'q\\[(.*)\\]q': '<span class="jt_quote">$1</span>',
                    's\\[(.*)\\]s': '<span class="jt_sample">$1</span>',
                    '-\\[(.*)\\]-': '<span class="jt_strike">$1</span>',
                    'i\\[(.*)\\]i': '<i>$1</i>',
                    '\\/\\[(.*)\\]\\/': '<i>$1</i>',
                    'b\\[(.*)\\]b': '<b>$1</b>',
                    '\\*\\[(.*)\\]\\*': '<b>$1</b>',
                    '_\\[(.*)\\]_': '<u>$1</u>',
                    'o\\[(.*)\\]o': '<span class="jt_spoiler" onclick="return doSpoiler(event);">$1</span>',
                    '\\/{{(.*)}}\\/': '<pre class="jt_code">$1</pre>',
                    '\\r\\n': '<br>',
                    '\\n': '<br>',
                    '\\r': '<br>'
                };

                preview = preview.replace("/&/g", "&amp;");
                for(var ix in regexReplacements) {
                    if(regexReplacements.hasOwnProperty(ix)) {
                        var rgx = new RegExp(ix, 'g');
                        while(preview.match(rgx) !== null) {
                            preview = preview.replace(rgx, regexReplacements[ix]);
                        }
                    }
                }

                preview = PostPreview.ConvertUrlToLink(preview);

                return preview;
            },

            ConvertUrlToLink: function(text)
            {
                return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target=\"_blank\">$1</a>');
            }

        }

        PostPreview.install();
        processPostBoxEvent.addHandler(PostPreview.installClickEvent);
    }
});
