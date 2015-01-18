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
                previewArea.innerHTML = PostPreview.generatePreview(form_body.value);
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
                document.getElementById("previewArea").innerHTML = PostPreview.generatePreview(document.getElementById("frm_body").value);
            },

            generatePreview: function(text)
            {
                var preview = text;

                // simple replacements
                preview = preview.replace(/&/g, "&amp;");
                preview = preview.replace(/</g, "&lt;");
                preview = preview.replace(/>/g, "&gt;");
                preview = preview.replace(/\r\n/g, "<br>");
                preview = preview.replace(/\n/g, "<br>");
                preview = preview.replace(/\r/g, "<br>");

                var complexReplacements = {
                    'red': {'from': ['r{','}r'], 'to': ['<span class="jt_red">','</span>']},
                    'green': {'from': ['g{','}g'], 'to': ['<span class="jt_green">','</span>']},
                    'blue': {'from': ['b{','}b'], 'to': ['<span class="jt_blue">','</span>']},
                    'yellow': {'from': ['y{','}y'], 'to': ['<span class="jt_yellow">','</span>']},
                    'olive': {'from': ['e\\[','\\]e'], 'to': ['<span class="jt_olive">','</span>']},
                    'lime': {'from': ['l\\[','\\]l'], 'to': ['<span class="jt_lime">','</span>']},
                    'orange': {'from': ['n\\[','\\]n'], 'to': ['<span class="jt_orange">','</span>']},
                    'pink': {'from': ['p\\[','\\]p'], 'to': ['<span class="jt_pink">','</span>']},
                    'quote': {'from': ['q\\[','\\]q'], 'to': ['<span class="jt_quote">','</span>']},
                    'sample': {'from': ['s\\[','\\]s'], 'to': ['<span class="jt_sample">','</span>']},
                    'strike': {'from': ['-\\[','\\]-'], 'to': ['<span class="jt_strike">','</span>']},
                    'italic1': {'from': ['i\\[','\\]i'], 'to': ['<i>','</i>']},
                    'italic2': {'from': ['\\/\\[','\\]\\/'], 'to': ['<i>','</i>']},
                    'bold1': {'from': ['b\\[','\\]b'], 'to': ['<b>','</b>']},
                    'bold2': {'from': ['\\*\\[','\\]\\*'], 'to': ['<b>','</b>']},
                    'underline': {'from': ['_\\[','\\]_'], 'to': ['<u>','</u>']},
                    'spoiler': {'from': ['o\\[','\\]o'], 'to': ['<span class="jt_spoiler" onclick="return doSpoiler(event);">','</span>']},
                    'code': {'from': ['\\/{{','}}\\/'], 'to': ['<pre class="jt_code">','</pre>']}
                };

                // replace matching pairs first
                for(var ix in complexReplacements) {
                    if(complexReplacements.hasOwnProperty(ix)) {
                        var rgx = new RegExp(complexReplacements[ix].from[0] + '(.*?)' + complexReplacements[ix].from[1], 'g');
                        while(preview.match(rgx) !== null) {
                            preview = preview.replace(rgx, complexReplacements[ix].to[0] + '$1' + complexReplacements[ix].to[1]);
                        }
                    }
                }

                // replace orphaned opening shacktags, close them at the end of the post.
                // this still has (at least) one bug, the shack code does care about nested tag order:
                // b[g{bold and green}g]b <-- correct
                // b[g{bold and green]b}g <-- }g is not parsed by the shack code
                for(var ix in complexReplacements) {
                    if(complexReplacements.hasOwnProperty(ix)) {
                        var rgx = new RegExp(complexReplacements[ix].from[0], 'g');
                        while(preview.match(rgx) !== null) {
                            preview = preview.replace(rgx, complexReplacements[ix].to[0]);
                            preview = preview + complexReplacements[ix].to[1];
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
