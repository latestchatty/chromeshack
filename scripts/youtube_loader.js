settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("youtube_loader"))
    {
        YoutubeLoader =
        {
            loadVideos: function(item, id)
            {
                var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postbody.getElementsByTagName("a");

                var imageRegex = /www\.youtube\.com\/watch\?v=/i;

                for (var i = 0; i < links.length; i++)
                {
                    var href = links[i].href;
                    if (href.match(imageRegex))
                    {
                        links[i].addEventListener("click", YoutubeLoader.toggleVideo, false);
                    }
                }
            },

            toggleVideo: function(e)
            {
                // left click only
                if (e.button == 0)
                {
                    var link = this;
                    // if there is a video after the link, remove it
                    if (link.nextSibling != null && link.nextSibling.className == "youtubeloader")
                    {
                        link.parentNode.removeChild(link.nextSibling);
                    }
                    else
                    {
                        // no video after the link? add one in!
                        var domain = String(link.href);
                        if (domain.substr(0, 7) == "http://")
                            domain = domain.substr(7);
                        if (domain.indexOf('/') != -1)
                            domain = domain.substring(0, domain.indexOf('/'));

                        var pos = link.href.indexOf("v=");
                        if (pos == -1) return;

                        var videoId = link.href.substr(pos + 2);
                        videoId = videoId.split('&');
                        videoId = videoId[0];

                        var url = "http://" + domain + "/v/" + videoId + "&hl=en_US&fs=1";

                        var o = document.createElement("object");
                        o.setAttribute("width", 640);
                        o.setAttribute("height", 385);
                        o.appendChild(YoutubeLoader.createParam("movie", url));
                        o.appendChild(YoutubeLoader.createParam("allowFullScreen", "true"));
                        o.appendChild(YoutubeLoader.createParam("allowscriptaccess", "always"));

                        var embed = document.createElement("embed");
                        embed.setAttribute("src", url);
                        embed.setAttribute("type", "application/x-shockwave-flash");
                        embed.setAttribute("allowscriptaccess", "always");
                        embed.setAttribute("allowfullscreen", "true");
                        embed.setAttribute("width", "640");
                        embed.setAttribute("height", "385");

                        o.appendChild(embed);

                        var div = document.createElement("div");
                        div.className = "youtubeloader";
                        div.appendChild(o);

                        // add the video right after the link
                        link.parentNode.insertBefore(div, link.nextSibling);
                    }
                    
                    e.preventDefault();
                }
            },

            createParam: function(name, value)
            {
                var param = document.createElement("param");
                param.setAttribute("name", name);
                param.setAttribute("value", value);
                return param;
            }
        }

        processPostEvent.addHandler(YoutubeLoader.loadVideos);
    }
});
