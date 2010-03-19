settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("highlight_original_poster"))
    {
        HighlightOriginalPoster =
        {
            authorRegex: /fpauthor_(\d+)/,

            css: getSetting("original_poster_css"),

            highlight: function(item, id, is_root_post)
            {
                if (is_root_post)
                {
                    var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");
                    var fpauthor = HighlightOriginalPoster.authorRegex.exec(fullpost.className);
                    if (fpauthor)
                    {
                        var authorId = fpauthor[1];
                        var style = "div#root_" + id + " div.olauthor_" + authorId + " a.oneline_user { " + HighlightOriginalPoster.css + " }";
                        insertStyle(style);
                    }
                }
            }
        }

        processPostEvent.addHandler(HighlightOriginalPoster.highlight);
    }
});
