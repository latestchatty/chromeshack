settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("video_loader"))
    {
        VideoLoader =
        {
            loadVideos: function(item)
            {
                var links = item.querySelectorAll(".sel .postbody a");
                for (var i = 0; i < links.length; i++) {
                    var parsedVideo = VideoLoader.getVideoType(links[i].href);
                    if (parsedVideo != null) {
                        ((parsedVideo, i) => {
                            if (links[i].querySelector("div.expando")) { return; }
                            links[i].addEventListener("click", e => {
                                VideoLoader.toggleVideo(e, parsedVideo, i);
                            });

                            var _postBody = links[i].parentNode;
                            var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })(parsedVideo, i);
                    }
                }
            },

            getVideoType: function(url)
            {
                // youtube videos and/or playlists (without offset)
                var _isStreamable = /https?\:\/\/streamable\.com\/([\w]+)/i.exec(url);
                var _isXboxDVR = /https?\:\/\/(?:.*\.)?xboxdvr\.com\/gamer\/([\w\d\-]+)\/video\/([\w\-]+)/i.exec(url);
                var _isYoutube = /https?\:\/\/(?:.*\.)?(?:youtube\.[\w]{2,3}|youtu.be)\/(?:(?:watch|watch_popup)?[\?\&tv\=]{3}?)?([\w\-]{11}[^\?\&t\=]?)(?:[\?\&]list=([\w]{34}))?/i.exec(url);
                var _isYTOffset = /https?\:\/\/(?:.*\.)?(?:youtube\.[\w]{2,3}|youtu.be)\/(?:.*[\?\&]t=([\ds]+))/i.exec(url);
                // twitch channels, videos, and clips (with time offset)
                var _isTwitch = /https?\:\/\/(?:clips\.twitch\.tv\/(\w+)|(?:.*\.)?twitch\.tv\/(?:.*?\/clip\/(\w+)|(?:videos\/([\w\-]+)(?:.*?t=(\w+))?|collections\/([\w\-]+))|([\w\-]+)))/i.exec(url);

                if (_isYoutube) {
                    return {
                        type: 1,
                        video: _isYoutube[1],
                        playlist: _isYoutube[2],
                        offset: _isYTOffset && _isYTOffset[1]
                    };
                }
                else if (_isTwitch) {
                    if (_isTwitch[6]) {
                        // twitch channels
                        return {
                            type: 2,
                            channel: _isTwitch[6]
                        };
                    } else if (_isTwitch[5]) {
                        // twitch collections
                        return {
                            type: 2,
                            collection: _isTwitch[5]
                        };
                    } else if (_isTwitch[3]) {
                        // twitch videos
                        return {
                            type: 2,
                            video: _isTwitch[3],
                            offset: _isTwitch[4]
                        };
                    } else if (_isTwitch[1] || _isTwitch[2]) {
                        // twitch clip
                        return {
                            type: 2,
                            clip: _isTwitch[1] || _isTwitch[2]
                        };
                    }
                }
                else if (_isStreamable) {
                    return {
                        type: 3,
                        video: _isStreamable[1]
                    }
                }
                else if (_isXboxDVR) {
                    return {
                        type: 4,
                        user: _isXboxDVR[1],
                        video: _isXboxDVR[2]
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
                    if (toggleMediaItem(link, _postId, index)) return;

                    if (videoObj && videoObj.type === 1)
                        VideoLoader.createYoutube(link, videoObj, _postId, index);
                    else if (videoObj && videoObj.type === 2)
                        VideoLoader.createTwitch(link, videoObj, _postId, index);
                    else if (videoObj && videoObj.type === 3 || videoObj.type === 4)
                        VideoLoader.createIframePlayer(link, videoObj, _postId, index);
                }
            },

            createIframePlayer: async function(link, videoObj, postId, index) {
                // handle both Streamable and XboxDVR Iframe embed types
                var user = videoObj.type === 4 && videoObj.user;
                var video_id = videoObj.video, video_src = "";

                // keep common 16:9 ratio
                var width = getSetting("video_loader_hd") ? 854 : 640;
                var height = getSetting("video_loader_hd") ? 480 : 360;

                if (videoObj.type === 3) {
                    // Streamable.com iFrame
                    video_src = await getStreamableLink(video_id);
                } else if (videoObj.type === 4) {
                    // XboxDVR iFrame
                    video_src = `https://xboxdvr.com/gamer/${user}/video/${video_id}/embed`;
                }

                if (video_src) {
                    var video = document.createElement("div");
                    var spacer = document.createElement("div");
                    spacer.setAttribute("class", "iframe-spacer hidden");
                    spacer.setAttribute("style", `min-width: ${width*.33}px; max-height: ${height}px; max-width: ${width}px;`);
                    video.setAttribute("class", "iframe-container");
                    video.setAttribute("id", `loader_${postId}-${index}`);
                    var iframe = document.createElement("iframe");
                    iframe.setAttribute("sandbox", "allow-same-origin");
                    iframe.setAttribute("id", `iframe_${postId}-${index}`);
                    iframe.setAttribute("src", `${video_src}`);
                    iframe.setAttribute("frameborder", "0");
                    iframe.setAttribute("scale", "tofit");
                    iframe.setAttribute("scrolling", "no");
                    iframe.setAttribute("allowfullscreen", "");
                    video.appendChild(iframe);
                    spacer.appendChild(video);
                    mediaContainerInsert(spacer, link, postId, index);
                }

                function getStreamableLink(shortcode) {
                    var __obf = "Basic aG9tdWhpY2xpckB3ZW1lbC50b3A=:JiMtMlQoOH1HSDxgJlhySg==";
                    return new Promise(resolve => {
                        fetchSafe(
                            `https://api.streamable.com/videos/${shortcode}`,
                            { headers: { "Authorization": __obf } }
                        ).then(json => {
                            // sanitized in common.js!
                            if (json && json.files.mp4.url)
                                resolve(json.files.mp4.url);
                            resolve(null);
                        })
                        .catch(err => { console.log(err); });
                    });
                }
            },

            createYoutube: function(link, videoObj, postId, index)
            {
                var video_src;
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
                    spacer.setAttribute("class", "iframe-spacer hidden");
                    spacer.setAttribute("style", `min-width: ${width*.33}px; max-height: ${height}px; max-width: ${width}px;`);
                    video.setAttribute("class", "yt-container");
                    video.setAttribute("id", `loader_${postId}-${index}`);
                    var iframe = document.createElement("iframe");
                    iframe.setAttribute("sandbox", "allow-same-origin allow-presentation");
                    iframe.setAttribute("id", `iframe_${postId}-${index}`);
                    iframe.setAttribute("src", `${video_src}`);
                    iframe.setAttribute("frameborder", "0");
                    iframe.setAttribute("allow", "autoplay; encrypted-media");
                    iframe.setAttribute("allowfullscreen", "");
                    video.appendChild(iframe);
                    spacer.appendChild(video);
                    mediaContainerInsert(spacer, link, postId, index);
                }
            },

            createTwitch: function(link, videoObj, postId, index)
            {
                var video_id = videoObj.video;
                var video_channel = videoObj.channel;
                var video_collection = videoObj.collection;
                var video_clip = videoObj.clip;
                var timeOffset = videoObj.offset || 0;

                var width = getSetting("video_loader_hd") ? 854 : 640;
                var height = getSetting("video_loader_hd") ? 480 : 360;

                var video_src;
                if (video_id) {
                    video_src = `https://player.twitch.tv/?video=v${video_id}&autoplay=true&muted=false&t=${timeOffset}`;
                } else if (video_channel) {
                    video_src = `https://player.twitch.tv/?channel=${video_channel}&autoplay=true&muted=false`;
                } else if (video_collection) {
                    video_src = `https://player.twitch.tv/?collection=${video_collection}&autoplay=true&muted=false`;
                } else if (video_clip) {
                    video_src = `https://clips.twitch.tv/embed?clip=${video_clip}&autoplay=true&muted=false`;
                }

                if (video_src) {
                    var video = document.createElement("div");
                    var spacer = document.createElement("div");
                    spacer.setAttribute("class", "iframe-spacer hidden");
                    spacer.setAttribute("style", `min-width: ${width*.33}px !important; max-height: ${height}px; max-width: ${width}px;`);
                    video.setAttribute("class", "twitch-container");
                    video.setAttribute("id", `loader_${postId}-${index}`);
                    var iframe = document.createElement("iframe");
                    iframe.setAttribute("sandbox", "allow-same-origin allow-scripts allow-presentation");
                    iframe.setAttribute("id", `iframe_${postId}-${index}`);
                    iframe.setAttribute("src", `${video_src}`);
                    iframe.setAttribute("frameborder", "0");
                    iframe.setAttribute("scrolling", "no");
                    iframe.setAttribute("allowfullscreen", "");
                    video.appendChild(iframe);
                    spacer.appendChild(video);
                    mediaContainerInsert(spacer, link, postId, index);
                }
            },
        }

        processPostEvent.addHandler(VideoLoader.loadVideos);
    }
});
