settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("highlight_original_poster"))
    {
        HighlightOriginalPoster =
        {
            authorRegex: /fpauthor_(\d+)/,

            css: getSetting("original_poster_css"),

            selectors: [],

            gatherCss: function(item, id, is_root_post)
            {
                if (is_root_post)
                {
                    var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");
                    var fpauthor = HighlightOriginalPoster.authorRegex.exec(fullpost.className);
                    if (fpauthor)
                    {
                        var authorId = fpauthor[1];
                        HighlightOriginalPoster.selectors.push("div#root_" + id + " div.olauthor_" + authorId + " a.oneline_user ");
                    }
                }
            },

            installCss: function()
            {
                if (HighlightOriginalPoster.selectors.length > 0)
                {
                    var css = HighlightOriginalPoster.selectors.join(", ");
                    css += " { " + HighlightOriginalPoster.css + " }";
                    insertStyle(css);
                }
                HighlightOriginalPoster.uninstall();
            },

            uninstall: function()
            {
                processPostEvent.removeHandler(HighlightOriginalPoster.gatherCss);
                fullPostsCompletedEvent.removeHandler(HighlightOriginalPoster.installCss);
            }
    
        }

        processPostEvent.addHandler(HighlightOriginalPoster.gatherCss);
        fullPostsCompletedEvent.addHandler(HighlightOriginalPoster.installCss);
    }
});
