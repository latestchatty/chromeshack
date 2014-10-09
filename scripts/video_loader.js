settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("video_loader"))
    {
        VideoLoader =
        {
            VIDEO_TYPE_NONE: 0,
            VIDEO_TYPE_YOUTUBE: 1,
            VIDEO_TYPE_VIMEO: 2,
            VIDEO_TYPE_GIFV: 3,
            VIDEO_TYPE_GFYCAT: 4,

            playerId: 0,

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
                else if (url.match(/i.imgur\.com\/\w+\.gifv?$/i))
                    return VideoLoader.VIDEO_TYPE_GIFV
                else if (VideoLoader.isGfycat(url))
                    return VideoLoader.VIDEO_TYPE_GFYCAT

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
                        else if (type == VideoLoader.VIDEO_TYPE_GIFV)
                            video = VideoLoader.createGifv(link.href);
                        else if (type == VideoLoader.VIDEO_TYPE_GFYCAT)
                            video = VideoLoader.createGfycat(link.href);


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
                var start = 0;
                
                if ((video_id = href.match(/www\.youtube\.com\/watch(_popup)?\?v=([^&#]+)(#t=(\d+))?/i)))
                {
                    start = video_id[4];
                    video_id = video_id[2];
                }
                else if ((video_id = href.match(/youtu\.be\/([^\?]+)(\?t=(.+))?/i)))
                {
                    start = VideoLoader.convertTime(video_id[3] || "");
                    video_id = video_id[1];
                }
                else
                    return null;

                var width = 640, height = 390;
                if (getSetting("video_loader_hd"))
                {
                    // if they want hd, just make the player bigger, embed api will use higher quality
                    width = 853;
                    height = 480;
                }

                var i = document.createElement("iframe");
                i.setAttribute("id", "player");
                i.setAttribute("type", "text/html");
                i.setAttribute("width", width);
                i.setAttribute("height", height);
                i.setAttribute("src", "//www.youtube.com/embed/" + video_id + "?autoplay=1&iv_load_policy=3&rel=0&start=" + start);
                i.setAttribute("frameborder", "0");
                i.setAttribute("style", "width: " + width + "px");

                return i;
            },

            convertTime: function(duration)
            {
                // convert a time like "1m30s" to "90", this is terrible.
                var match;
                if ((match = duration.match(/((\d+)m)?((\d+)s)?/)))
                    return 60 * parseInt(match[2] || 0) + parseInt(match[4] || 0);

                return duration;
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

            createGifv: function(href)
            {
                var video_id;
                
                if ((video_id = href.match(/i.imgur\.com\/(\w+)/i)))
                    video_id = video_id[1];
                else
                    return null;

                var v = document.createElement("video");
                v.setAttribute("src", "//i.imgur.com/" + video_id + ".mp4");
                v.setAttribute("autoplay", "true");
                v.setAttribute("loop", "true");
                return v;
            },

            createGfycat: function(href)
            {
                var video_id = VideoLoader.getGfycatId(href);
                
                if (video_id === false)
                    return null;

                var v = document.createElement("video");
                v.setAttribute("src", "//zippy.gfycat.com/" + video_id + ".webm");
                v.setAttribute("autoplay", "true");
                v.setAttribute("loop", "true");
                return v;
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
            },

            isGfycat: function(href)
            {
                // some urls don't end in jpeg/png/etc so the normal test won't work
                if (/http\:\/\/gfycat\.com\/\w+$/.test(href))
                {
                    return true;
                }

                return false;
            },

            getGfycatId: function(href)
            {
                if ((m = /http\:\/\/gfycat.com\/(\w+)$/.exec(href)) != null)
                    return m[1];

                return false;
            }
        }

        processPostEvent.addHandler(VideoLoader.loadVideos);
    }
});
