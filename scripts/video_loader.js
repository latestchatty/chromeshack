settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("video_loader"))
    {
        VideoLoader =
        {
            parsedVideo: null,

            loadVideos: function(item)
            {
                // don't retrace our DOM nodes (use relative positions of event items)
                var links = item.querySelectorAll(".sel .postbody a");
                for (var i = 0; i < links.length; i++) {
                    VideoLoader.parsedVideo = VideoLoader.getVideoType(links[i].href);
                    if (VideoLoader.parsedVideo != null) {
                        (i => {
                            if (links[i].querySelector("div.expando")) { return; }
                            links[i].addEventListener("click", e => {
                                VideoLoader.toggleVideo(e, i);
                            });

                            var _postBody = links[i].parentNode;
                            var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })(i);
                    }
                }
            },

            getVideoType: function(url)
            {
                // normal youtube videos
                var _isYoutube1 = /https\:\/\/(?:.*\.|)(?:youtube\..*|youtu.be)\/(?:.*v=([\w\-]{11}).*|([\w\-]{11})(?:\?)?)/i;
                // youtube playlists with or without video indexes
                var _isYoutube2 = /https\:\/\/(?:.*\.|)(?:youtube\..*|youtu.be)\/(?:.*v=([\w\-]{11}).*list=([\w\-]{34})|.*list=([\w\-]{34}))/i;
                // matching for time offsets (works with playlists or simple videos)
                var _isYTOffset = /https\:\/\/(?:.*\.|)(?:youtube\..*|youtu.be)\/(?:.*t=([\d]+))/i;
                // twitch channels (with time offset)
                var _isTwitch1 = /https\:\/\/(?:www\.)?twitch.tv\/(?:videos\/|\?channel=|)([\w\-]+)(?:\?t=([\w\-]+)|)/i;
                // twitch archived videos (with time offset)
                var _isTwitch2 = /https\:\/\/(?:www\.|)?twitch.tv\/(?:.*?\&t=([\w\-]+).*?\&video=v([\w\-]+)|.*?\&video=v([\w\-]+))/i;
                // twitch clips
                var _isTwitch3 = /https\:\/\/clips\.twitch.tv\/(?:.*\/([\w\-]+)|([\w\-]+))$/i;
                var _ytMatch1 = _isYoutube1.exec(url);
                var _ytMatch2 = _isYoutube2.exec(url);
                var _ytMatchOffset = _isYTOffset.exec(url);
                var _twitchMatch1 = _isTwitch1.exec(url);
                var _twitchMatch2 = _isTwitch2.exec(url);
                var _twitchMatch3 = _isTwitch3.exec(url);

                if (_ytMatch1)
                    return {
                        type: 1,
                        id: _ytMatch1[1] || _ytMatch1[2],
                        offset: _ytMatchOffset && _ytMatchOffset[1]
                    };
                else if (_ytMatch2)
                    return {
                        type: 1,
                        id: _ytMatch2[1],
                        playlist: _ytMatch2[2],
                        offset: _ytMatchOffset && _ytMatchOffset[1]
                    };
                else if (_twitchMatch1)
                    return { type: 2, channel: _twitchMatch1[1] };
                else if (_twitchMatch2)
                    return {
                        type: 2,
                        id: _twitchMatch2[2] || _twitchMatch2[3],
                        offset: _twitchMatch2[1]
                    };
                else if (_twitchMatch3)
                    return { type: 2, clip: _twitchMatch3[1] || _twitchMatch3[2] };

                return null;
            },

            toggleVideo: function(e, index)
            {
                // left click only
                if (e.button == 0)
                {
                    e.preventDefault();
                    var link = e.target;
                    var _expandoClicked = link.classList !== undefined && link.classList.contains("expando");
                    link = _expandoClicked ? link.parentNode : e.target;
                    var _postBody = link.parentNode;
                    var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    if (toggleMediaItem(link, _postBody, _postId, index)) { return; }

                    if (VideoLoader.parsedVideo.type === 1)
                        VideoLoader.createYoutube(link, _postId, index);
                    else if (VideoLoader.parsedVideo.type === 2)
                        VideoLoader.createTwitch(link, _postId, index);
                }
            },

            createYoutube: function(link, postId, index)
            {
                console.log(VideoLoader.parsedVideo);
                var video_id = VideoLoader.parsedVideo.id;
                var video_playlist = VideoLoader.parsedVideo.playlist;
                var timeOffset = VideoLoader.parsedVideo.offset || 0;

                // if they want hd, just make the player bigger, embed api will use higher quality
                var width = getSetting("video_loader_hd") ? 853 : 640;
                var height = getSetting("video_loader_hd") ? 480 : 390;

                if (video_id && video_playlist)
                    video_src = `https://www.youtube.com/embed/videoseries?v=${video_id}&list=${video_playlist}&enablejsapi=1&autoplay=1&start=${timeOffset}`;
                else if (video_id)
                    video_src = `https://www.youtube.com/embed/${video_id}?autoplay=1&iv_load_policy=3&rel=0&enablejsapi=1&start=${timeOffset}`;
                else if (video_playlist)
                    video_src = `https://www.youtube.com/embed/videoseries?list=${video_playlist}&enablejsapi=1&autoplay=1`;

                console.log(video_src);
                if (video_src) {
                    var video = document.createElement("div");
                    video.setAttribute("class", "yt-container");
                    video.setAttribute("id", `loader_${postId}-${index}`);
                    video.innerHTML = /*html*/`
                        <iframe
                            id="iframe_${postId}-${index}"
                            width="${width}"
                            height="${height}"
                            src="${video_src}"
                            frameborder="0"
                            allow="autoplay; encrypted-media"
                            allowfullscreen
                        >
                        </iframe>
                    `;
                    mediaContainerInsert(video, link, postId, index);
                }
            },

            createTwitch: function(link, postId, index)
            {
                console.log(VideoLoader.parsedVideo);
                var video_id = VideoLoader.parsedVideo.id;
                var video_channel = VideoLoader.parsedVideo.channel;
                var video_clip = VideoLoader.parsedVideo.clip;
                var timeOffset = VideoLoader.parsedVideo.offset || 0;

                var width = getSetting("video_loader_hd") ? 853 : 640;
                var height = getSetting("video_loader_hd") ? 480 : 390;

                var video_src;
                if (video_id) {
                    video_src = `https://player.twitch.tv/?video=v${video_id}&autoplay=true&muted=false&t=${timeOffset}`;
                } else if (video_clip) {
                    video_src = `https://clips.twitch.tv/embed?clip=${video_clip}&autoplay=true&muted=false`;
                } else if (video_channel) {
                    video_src = `https://player.twitch.tv/?channel=${video_channel}&autoplay=true&muted=false`;
                }

                console.log(video_src);
                if (video_src) {
                    var video = document.createElement("div");
                    video.setAttribute("class", "twitch-container");
                    video.setAttribute("id", `loader_${postId}-${index}`);
                    video.innerHTML = /*html*/`
                        <iframe
                            id="iframe_${postId}-${index}"
                            width="${width}"
                            height="${height}"
                            src="${video_src}"
                            frameborder="0"
                            scrolling="no"
                            allowfullscreen
                        >
                        </iframe>
                    `;

                    mediaContainerInsert(video, link, postId, index);
                }
            },
        }

        processPostEvent.addHandler(VideoLoader.loadVideos);
    }
});
