settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("social_loader"))
    {
        SocialLoader =
        {
            SOCIAL_TYPE_NONE: 0,
            SOCIAL_TYPE_TWITTER: 1,

            tweetCache: {},

            loadSocial: function(item, id)
            {
                var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postbody.getElementsByTagName("a");

                for (var i = 0; i < links.length; i++)
                {
                    var type = SocialLoader.getSocialType(links[i].href);
                    if (type != SocialLoader.SOCIAL_TYPE_NONE)
                    {
                        links[i].addEventListener("click", SocialLoader.toggleSocial, false);
                    }
                }
            },

            getSocialType: function(url)
            {
                if (url.match(/twitter\.com\/\w+\/status\/\d+.*/i))
                    return SocialLoader.SOCIAL_TYPE_TWITTER;

                return SocialLoader.SOCIAL_TYPE_NONE;
            },

            toggleSocial: function(e)
            {
                // left click only
                if (e.button === 0)
                {
                    var link = this;
                    // if there is an embed after the link, remove it
                    if (link.nextSibling !== null && link.nextSibling.className === "SocialLoader")
                    {
                        link.parentNode.removeChild(link.nextSibling);
                    }
                    else
                    {
                        var type = SocialLoader.getSocialType(link.href);

                        if (type === SocialLoader.SOCIAL_TYPE_TWITTER)
                            SocialLoader.fetchTwitter(link);
                    }

                    e.preventDefault();
                }
            },

            fetchTwitter: function(link)
            {
                if(SocialLoader.tweetCache.hasOwnProperty(link))
                {
                    SocialLoader.createTwitter(link, SocialLoader.tweetCache[link]);
                }
                else
                {
                    var loader = document.createElement("img");
                    loader.className = "SocialLoaderGif";
                    loader.src = chrome.extension.getURL("images/loading-pinned.gif");
                    link.parentNode.insertBefore(loader, link.nextSibling);

                    $.ajax({
                        url: "http://chatty.nevares.com/tweet",
                        data: "tweetUrl=" + link.href,
                        dataType: "html",
                        timeout: 5000,
                        success: function(data)
                        {
                            SocialLoader.createTwitter(link, data);
                            SocialLoader.tweetCache[link] = data;
                        },
                        error: function()
                        {
                            // GET failed, fall back to opening the link
                            window.open(link.href);
                        }
                    });
                }
            },

            createTwitter: function(link, data)
            {
                if (link.nextSibling !== null && link.nextSibling.className === "SocialLoaderGif")
                {
                    link.parentNode.removeChild(link.nextSibling);
                }

                var div = document.createElement("div");
                div.className = "SocialLoader";
                div.innerHTML = data;
                div.firstChild.setAttribute("data-theme", "dark");

                // add the embed right after the link
                link.parentNode.insertBefore(div, link.nextSibling);

                var twitterWidget = document.createElement("script");
                twitterWidget.setAttribute("async", "");
                twitterWidget.setAttribute("src", "//platform.twitter.com/widgets.js");
                twitterWidget.setAttribute("charset", "utf-8");
                document.head.appendChild(twitterWidget);
            }
        };

        processPostEvent.addHandler(SocialLoader.loadSocial);
    }
});