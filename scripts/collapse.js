if (getSetting("enabled_scripts").contains("collapse_threads"))
{
    Collapse =
    {
        collapsed: getSetting("collapsed_threads"),

        toggle: function(item, id)
        {
            var root = document.getElementById("root_" + id);
            // only process for root posts
            if (root)
            {
                var postmeta = getDescendentByTagAndClassName(item, "div", "postmeta");

                var close = getDescendentByTagAndClassName(postmeta, "a", "closepost");
                var show = getDescendentByTagAndClassName(postmeta, "a", "showpost");
                close.addEventListener("click", function() { Collapse.close(id); });
                show.addEventListener("click", function() { Collapse.show(id); });

                // this thread should be collapsed
                if (Collapse.collapsed.contains(id))
                {
                    root.className += " collapsed";
                    show.className = "showpost";
                    close.className = "closepost hidden";
                }

            }
        },

        close: function(id)
        {
            chrome.extension.sendRequest({name: "collapseThread", "id": id});
        },

        show: function(id)
        {
            chrome.extension.sendRequest({name: "unCollapseThread", "id": id});
        }
    }

    processPostEvent.addHandler(Collapse.toggle);
}
