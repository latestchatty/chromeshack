// i ate a cat

settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("shorten_posts"))
    {
        ShortenPosts =
        {
            installCSS: function()
            {
                document.body.className += " shorten_posts";
            },

            installButton: function(item)
            {
                var postBody = getDescendentByTagAndClassName(item, "div", "postbody");

                if(postBody.scrollHeight > 600)
                {
                    var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");

                    var button = document.createElement("a");
                    button.href = "#";
                    button.innerText = "+";
                    button.addEventListener("click", ShortenPosts.toggleShorten);

                    var div = document.createElement("div");
                    div.className = "toggle_shorten";
                    div.appendChild(button);

                    fullpost.appendChild(div);
                }
            },

            toggleShorten: function(e)
            {
                e.preventDefault();
                var fullpost = e.target.parentNode.parentNode;
                var postBody = getDescendentByTagAndClassName(fullpost, "div", "postbody");
                if(postBody.className.indexOf("unshortened") !== -1)
                {
                    postBody.className = "postbody";
                    e.target.innerText = "+";
                }
                else
                {
                    postBody.className += " unshortened";
                    e.target.innerText = "–";
                }
            },
        };

        processPostEvent.addHandler(ShortenPosts.installButton);
        ShortenPosts.installCSS();
    }
});
