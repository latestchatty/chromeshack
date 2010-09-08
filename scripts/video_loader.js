settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("video_loader"))
    {
        VideoLoader =
        {
            VIDEO_TYPE_NONE: 0,
            VIDEO_TYPE_YOUTUBE: 1,
            VIDEO_TYPE_VIMEO: 2,

            playerId: 0,

            install: function()
            {
                if (getSetting("video_loader_hd"))
                {
                    // inject our helper script if the user wants the videos to be auto-resized to HD versions
                    var s = document.createElement("script");
                    s.setAttribute("src", chrome.extension.getURL("scripts/video_loader_helper.js"));
                    s.setAttribute("type", "text/javascript");
                    document.head.appendChild(s);
                }
            },

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
                if (url.match(/www\.youtube\.com\/watch(_popup)?\?v=/i))
                    return VideoLoader.VIDEO_TYPE_YOUTUBE;
                else if (url.match(/youtu\.be\/.+/i))
                    return VideoLoader.VIDEO_TYPE_YOUTUBE;
                else if (url.match(/vimeo\.com\/\d+/i))
                    return VideoLoader.VIDEO_TYPE_VIMEO
                else if (url.match(/vimeo\.com\/moogaloop\.swf\?clip_id=\d+.*/i))
                    return VideoLoader.VIDEO_TYPE_VIMEO

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
                        else if (type == VideoLoader.VIDEO_TYPE_VIMEO)
                            video = VideoLoader.createVimeo(link.href);


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
                
                if ((video_id = href.match(/www\.youtube\.com\/watch(_popup)?\?v=([^&]+)/i)))
                    video_id = video_id[2];
                else if ((video_id = href.match(/youtu\.be\/(.+)/i)))
                    video_id = video_id[1];
                else
                    return null;

                var id = "youtube_player_" + this.playerId;
                this.playerId++;

                var url = "http://youtube.com/v/" + video_id + "&hl=en_US&fs=1&enablejsapi=1&version=3&hd=1&playerapiid=" + id;


                var o = VideoLoader.createVideoObject(url);
                o.id = id;
                return o;
            },

            createVimeo: function(href)
            {
                var video_id;
                
                if ((video_id = href.match(/vimeo\.com\/(\d+)/i)))
                    video_id = video_id[1];
                else if ((video_id = href.match(/vimeo\.com\/moogaloop\.swf\?clip_id=(\d+)/i)))
                    video_id = video_id[1];
                else
                    return null;

                var url = "http://vimeo.com/moogaloop.swf?clip_id=" + video_id + "&show_title=1&show_byline=1&fullscreen=1";

                return VideoLoader.createVideoObject(url);
            },

            createVideoObject: function(url)
            {
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
            },

            onYouTubePlayerReady: function(playerId)
            {
                console.log("youtube player ready.");
            }
        }

        VideoLoader.install();
        processPostEvent.addHandler(VideoLoader.loadVideos);
    }
});
