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
        var preview = text.replace(/&/g, "&amp;");
        preview = preview.replace(/</g, "&lt;");
        preview = preview.replace(/>/g, "&gt;");
        preview = preview.replace(/r{/g, '<span class="jt_red">');
        preview = preview.replace(/g{/g, '<span class="jt_green">');
        preview = preview.replace(/b{/g, '<span class="jt_blue">');
        preview = preview.replace(/y{/g, '<span class="jt_yellow">');
        preview = preview.replace(/e\[/g, '<span class="jt_olive">');
        preview = preview.replace(/l\[/g, '<span class="jt_lime">');
        preview = preview.replace(/n\[/g, '<span class="jt_orange">');
        preview = preview.replace(/p\[/g, '<span class="jt_pink">');
        preview = preview.replace(/q\[/g, '<span class="jt_quote">');
        preview = preview.replace(/s\[/g, '<span class="jt_sample">');
        preview = preview.replace(/-\[/g, '<span class="jt_strike">');
        preview = preview.replace(/}r|}g|}b|}y|\]e|\]l|\]n|\]p|\]q|\]s|\]-|\]o/g, "</span>");
        preview = preview.replace(/i\[/g, "<i>");
        preview = preview.replace(/\]i/g, "</i>");
        preview = preview.replace(/\/\[/g, "<i>");
        preview = preview.replace(/\]\//g, "</i>");
        preview = preview.replace(/b\[/g, "<b>");
        preview = preview.replace(/\]b/g, "</b>");
        preview = preview.replace(/\*\[/g, "<b>");
        preview = preview.replace(/\]\*/g, "</b>");
        preview = preview.replace(/_\[/g, "<u>");
        preview = preview.replace(/\]_/g, "</u>");
        preview = preview.replace(/o\[/g, '<span class="jt_spoiler" onclick="return doSpoiler(event);">');
        preview = preview.replace(/\/{{/g, '<pre class="jt_code">');
        preview = preview.replace(/}}\//g, "</pre>");
        preview = preview.replace(/\r\n/g, "<br>");
        preview = preview.replace(/\n/g, "<br>");
        preview = preview.replace(/\r/g, "<br>");
        preview = PostPreview.ConvertUrlToLink(preview);

        return preview;
    },

    ConvertUrlToLink: function(text)
    {
        return text.replace(/(https?:\/\/[^ |^<]+)/g, '<a href="$1" target=\"_blank\">$1</a>');
    }

}

if (getSetting("enabled_scripts").contains("post_preview"))
{
    PostPreview.install();
    processPostBoxEvent.addHandler(PostPreview.installClickEvent);
}
