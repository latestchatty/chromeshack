settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("video_loader"))
    {
        VideoLoader =
        {
            VIDEO_TYPE_NONE: 0,
            VIDEO_TYPE_YOUTUBE: 1,

            loadVideos: function(item, id)
            {
                var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postbody.getElementsByTagName("a");

                for (var i = 0; i < links.length; i++)
                {
                    var type = VideoLoader.getVideoType(links[i].href);
                    if (type != VideoLoader.VIDEO_TYPE_NONE)
                    {
                        links[i].addEventListener("click", VideoLoader.toggleVideo, false);
                    }
                }
            },

            getVideoType: function(url)
            {
                if (url.match(/www\.youtube\.com\/watch\?v=/i))
                    return VideoLoader.VIDEO_TYPE_YOUTUBE;
                else if (url.match(/youtu\.be\/.+/i))
                    return VideoLoader.VIDEO_TYPE_YOUTUBE;

                return VideoLoader.VIDEO_TYPE_NONE;
            },

            toggleVideo: function(e)
            {
                // left click only
                if (e.button == 0)
                {
                    var link = this;
                    // if there is a video after the link, remove it
                    if (link.nextSibling != null && link.nextSibling.className == "videoloader")
                    {
                        link.parentNode.removeChild(link.nextSibling);
                    }
                    else
                    {
                        // no video after the link? add one in!
                        //
                        var type = VideoLoader.getVideoType(link.href);
                        var video;

                        if (type == VideoLoader.VIDEO_TYPE_YOUTUBE)
                            video = VideoLoader.createYoutube(link.href);

                        // we actually created a video
                        if (video != null)
                        {
                            var div = document.createElement("div");
                            div.className = "videoloader";
                            div.appendChild(video);

                            // add the video right after the link
                            link.parentNode.insertBefore(div, link.nextSibling);
                        }
                    }
                    
                    e.preventDefault();
                }
            },

            createYoutube: function(href)
            {
                var video_id;
                
                if ((video_id = href.match(/www\.youtube\.com\/watch\?v=([^&]+)?/i)))
                    video_id = video_id[1];
                else if ((video_id = href.match(/youtu\.be\/(.+)/i)))
                    video_id = video_id[1];
                else
                    return null;

                var url = "http://youtube.com/v/" + video_id + "&hl=en_US&fs=1";

                var o = document.createElement("object");
                o.setAttribute("width", 640);
                o.setAttribute("height", 385);
                o.appendChild(VideoLoader.createParam("movie", url));
                o.appendChild(VideoLoader.createParam("allowFullScreen", "true"));
                o.appendChild(VideoLoader.createParam("allowscriptaccess", "always"));

                var embed = document.createElement("embed");
                embed.setAttribute("src", url);
                embed.setAttribute("type", "application/x-shockwave-flash");
                embed.setAttribute("allowscriptaccess", "always");
                embed.setAttribute("allowfullscreen", "true");
                embed.setAttribute("width", "640");
                embed.setAttribute("height", "385");

                o.appendChild(embed);
                return o;
            },

            createParam: function(name, value)
            {
                var param = document.createElement("param");
                param.setAttribute("name", name);
                param.setAttribute("value", value);
                return param;
            }
        }

        processPostEvent.addHandler(VideoLoader.loadVideos);
    }
});
