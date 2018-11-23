settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("video_loader"))
    {
        VideoLoader =
        {
            loadVideos: function(item)
            {
                // don't retrace our DOM nodes (use relative positions of event items)
                var links = item.querySelectorAll(".sel .postbody a");
                for (var i = 0; i < links.length; i++) {
                    var parsedVideo = VideoLoader.getVideoType(links[i].href);
                    if (parsedVideo != null) {
                        (() => {
                            if (links[i].querySelector("div.expando")) { return; }
                            links[i].addEventListener("click", e => {
                                VideoLoader.toggleVideo(e, parsedVideo, i);
                            });

                            var _postBody = links[i].parentNode;
                            var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })();
                    }
                }
            },

            getVideoType: function(url)
            {
                // youtube videos and/or playlists (without offset)
                var _isYoutube = /https\:\/\/(?:.*\.)?(?:youtube\.[\w]{2,3}|youtu.be)\/(?:(?:watch|watch_popup)?[\?\&tv\=]{3}?)?([\w\-]{11}[^\?\&t\=]?)(?:[\?\&]list=([\w]{34}))?/i;
                var _isYTOffset = /https\:\/\/(?:.*\.)?(?:youtube\.[\w]{2,3}|youtu.be)\/(?:.*[\?\&]t=([\ds]+))/i;
                // twitch channels, videos, and clips (with time offset)
                var _isTwitch = /https\:\/\/(?:.*\.)?twitch.tv\/(?:videos\/([\d]{9})|\?channel=([\w\-]+))?(?:\?t=([\w\-]+)|([\w\-]+))?(?:\/clip\/([\w\-]+))?/i;
                var _ytMatch = _isYoutube.exec(url);
                var _ytOffsetMatch = _isYTOffset.exec(url);
                var _twitchMatch = _isTwitch.exec(url);

                if (_ytMatch) {
                    return {
                        type: 1,
                        video: _ytMatch[1],
                        playlist: _ytMatch[2],
                        offset: _ytOffsetMatch && _ytOffsetMatch[1]
                    };
                }
                else if (_twitchMatch) {
                    if (_twitchMatch[4] || _twitchMatch[2]) {
                        // twitch channels
                        return {
                            type: 2,
                            channel: _twitchMatch[4] || _twitchMatch[2]
                        };
                    } else if (_twitchMatch[1]) {
                        // twitch videos
                        return {
                            type: 2,
                            video: _twitchMatch[1],
                            offset: _twitchMatch[3]
                        };
                    } else if (_twitchMatch[4] && _twitchMatch[5]) {
                        // twitch clip
                        return {
                            type: 2,
                            clip: _twitchMatch[5]
                        };
                    }
                }

                return null;
            },

            toggleVideo: function(e, videoObj, index)
            {
                // left click only
                if (e.button == 0)
                {
                    e.preventDefault();
                    var _expandoClicked = e.target.classList !== undefined && e.target.classList.contains("expando");
                    var link = _expandoClicked ? e.target.parentNode : e.target;
                    var _postBody = link.parentNode;
                    var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    if (toggleMediaItem(link, _postBody, _postId, index)) { return; }

                    if (videoObj.type === 1)
                        VideoLoader.createYoutube(link, videoObj, _postId, index);
                    else if (videoObj.type === 2)
                        VideoLoader.createTwitch(link, videoObj, _postId, index);
                }
            },

            createYoutube: function(link, videoObj, postId, index)
            {
                var video_id = videoObj.video;
                var video_playlist = videoObj.playlist;
                var timeOffset = videoObj.offset ? `&start=${videoObj.offset}` : "";

                // keep common 16:9 ratio
                var width = getSetting("video_loader_hd") ? 854 : 640;
                var height = getSetting("video_loader_hd") ? 480 : 360;

                if (video_id && video_playlist)
                    video_src = `https://www.youtube.com/embed/videoseries?v=${video_id}&list=${video_playlist}&autoplay=1${timeOffset}`;
                else if (video_id)
                    video_src = `https://www.youtube.com/embed/${video_id}?autoplay=1${timeOffset}`;
                else if (video_playlist)
                    video_src = `https://www.youtube.com/embed/videoseries?list=${video_playlist}&autoplay=1`;

                if (video_src) {
                    var video = document.createElement("div");
                    var spacer = document.createElement("div");
                    spacer.setAttribute("class", "iframe-spacer");
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
                    spacer.appendChild(video);
                    mediaContainerInsert(spacer, link, postId, index, width, height);
                }
            },

            createTwitch: function(link, videoObj, postId, index)
            {
                var video_id = videoObj.video;
                var video_channel = videoObj.channel;
                var video_clip = videoObj.clip;
                var timeOffset = videoObj.offset || 0;

                var width = getSetting("video_loader_hd") ? 854 : 640;
                var height = getSetting("video_loader_hd") ? 480 : 360;

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
                    var spacer = document.createElement("div");
                    spacer.setAttribute("class", "iframe-spacer");
                    video.setAttribute("class", "twitch-container");
                    video.setAttribute("id", `loader_${postId}-${index}`);
                    video.innerHTML = /*html*/`
                        <iframe
                            id="iframe_${postId}-${index}"
                            src="${video_src}"
                            width="${width}"
                            height="${height}"
                            frameborder="0"
                            scrolling="no"
                            allowfullscreen
                        >
                        </iframe>
                    `;
                    spacer.appendChild(video);
                    mediaContainerInsert(spacer, link, postId, index, width, height);
                }
            },
        }

        processPostEvent.addHandler(VideoLoader.loadVideos);
    }
});
