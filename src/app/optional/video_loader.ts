import * as browser from "webextension-polyfill";
import { objContains } from "../core/common";
import { enabledContains } from "../core/settings";
import { processExpandoLinks, toggleMediaItem, appendMedia, mediaContainerInsert } from "../core/media_helpers";
import { processPostEvent } from "../core/events";

const VideoLoader = {
    async install() {
        return enabledContains("video_loader").then((res) => {
            if (res) processPostEvent.addHandler(VideoLoader.loadVideos);
        });
    },

    loadVideos(item) {
        let links = [...item.querySelectorAll(".sel .postbody a")];
        if (links) processExpandoLinks(links, VideoLoader.getVideoType, VideoLoader.toggleVideo);
    },

    getVideoType(url) {
        let _isStreamable = /https?:\/\/streamable\.com\/([\w]+)/i.exec(url);
        let _isXboxDVR = /https?:\/\/(?:.*\.)?xboxdvr\.com\/gamer\/([\w-]+)\/video\/([\w-]+)/i.exec(url);
        // youtube videos and/or playlists (vid id: $1, playlist id: $2, offset: $3)
        let _isYoutube = /https?:\/\/(?:.+\.)?youtube\..+\/(?:watch.+?v?=([\w-]+)(?:&list=([\w-]+))?(?:.*&t=(\d+))?|playlist\?list=([\w-]+))/i.exec(
            url,
        );
        let _isYoutubeShort = /https?:\/\/youtu\.be\/([\w-]+)(?:\?t=(\d+))?/i.exec(url);
        // twitch channels, videos, and clips (with time offset)
        let _isTwitch = /https?:\/\/(?:clips\.twitch\.tv\/(\w+)|(?:.*\.)?twitch\.tv\/(?:.*?\/clip\/(\w+)|(?:videos\/([\w-]+)(?:.*?t=(\w+))?|collections\/([\w-]+))|([\w-]+)))/i.exec(
            url,
        );
        let _isMixer = /https:\/\/(?:.+\.)?mixer\.com\/([\w-]+)(\?vod=[\w-]+|\?clip=[\w-]+)?/i.exec(url);
        let _isFacebook = /https:\/\/(?:.+\.)?facebook.(?:.+?)\/.+\/videos\/(\d+)\/?/i.exec(url);

        if (_isYoutube || _isYoutubeShort) {
            return {
                type: 1,
                video: (_isYoutube && _isYoutube[1]) || (_isYoutubeShort && _isYoutubeShort[1]),
                playlist: _isYoutube && _isYoutube[2],
                offset: (_isYoutube && _isYoutube[3]) || (_isYoutubeShort && _isYoutubeShort[2]),
            };
        } else if (_isTwitch) {
            // twitch channels
            if (_isTwitch[6]) return { type: 2, channel: _isTwitch[6] };
            // twitch collections
            else if (_isTwitch[5]) return { type: 2, collection: _isTwitch[5] };
            // twitch videos
            else if (_isTwitch[3]) return { type: 2, video: _isTwitch[3], offset: _isTwitch[4] };
            // twitch clips
            else if (_isTwitch[1] || _isTwitch[2]) return { type: 2, clip: _isTwitch[1] || _isTwitch[2] };
        }
        // assorted common media hosts
        else if (_isStreamable) return { type: 3, video: _isStreamable[1] };
        else if (_isXboxDVR) return { type: 4, user: _isXboxDVR[1], video: _isXboxDVR[2] };
        else if (_isMixer) return { type: 5, user: _isMixer[1], video: _isMixer[2] };
        else if (_isFacebook) return { type: 6, video: _isFacebook[1] };
        return null;
    },

    toggleVideo(e, videoObj, postId, index) {
        // left click only
        if (e.button == 0) {
            e.preventDefault();
            let _expandoClicked = e.target.classList !== undefined && objContains("expando", e.target.classList);
            let link = _expandoClicked ? e.target.parentNode : e.target;
            if (toggleMediaItem(link)) return;

            if (videoObj && videoObj.type === 1) VideoLoader.createYoutube(link, videoObj, postId, index);
            else if (videoObj && videoObj.type === 2) VideoLoader.createTwitch(link, videoObj, postId, index);
            else if (videoObj && videoObj.type >= 3 && videoObj.type <= 6)
                VideoLoader.createIframePlayer(link, videoObj, postId, index);
        }
    },

    async getStreamableLink(shortcode) {
        let __obf = "Basic aG9tdWhpY2xpckB3ZW1lbC50b3A=:JiMtMlQoOH1HSDxgJlhySg==";
        let json = await browser.runtime.sendMessage({
            name: "corbFetch",
            url: `https://api.streamable.com/videos/${shortcode}`,
            fetchOpts: { headers: { Authorization: __obf } },
        }); // sanitized in common.js!
        let url_match = json && json.embed_code ? /src\="(.*?)"/.exec(json.embed_code) : "";
        return url_match ? url_match[1] : "";
    },

    async createIframePlayer(link, videoObj, postId, index) {
        // handle both Streamable and XboxDVR Iframe embed types
        let user = videoObj.user;
        let video_id = videoObj.video || "";
        let video_src = "";

        if (videoObj.type === 3) {
            // Streamable.com iFrame
            video_src = await VideoLoader.getStreamableLink(video_id);
        } else if (videoObj.type === 4) {
            // XboxDVR iFrame
            video_src = `https://xboxdvr.com/gamer/${user}/video/${video_id}/embed`;
        } else if (videoObj.type === 5) {
            // Mixer iFrame
            video_src = `https://mixer.com/embed/player/${user}${video_id}`;
        } else if (videoObj.type === 6) {
            // Facebook Video iFrame
            video_src = `https://www.facebook.com/video/embed?video_id=${video_id}`;
        }

        if (video_src) {
            let iframe = appendMedia({
                src: [video_src],
                link,
                postId,
                index,
                type: { iframeEmbed: videoObj },
            });
            mediaContainerInsert(iframe, link, postId, index);
        }
    },

    createYoutube(link, videoObj, postId, index) {
        let video_src;
        let video_id = videoObj.video;
        let video_playlist = videoObj.playlist;
        let timeOffset = videoObj.offset ? `&start=${videoObj.offset}` : "";

        if (video_id && video_playlist)
            video_src = `https://www.youtube.com/embed/${video_id}?list=${video_playlist}&autoplay=1${timeOffset}`;
        else if (video_id) video_src = `https://www.youtube.com/embed/${video_id}?autoplay=1${timeOffset}`;
        else if (video_playlist)
            video_src = `https://www.youtube.com/embed/videoseries?list=${video_playlist}&autoplay=1`;

        if (video_src) {
            let iframe = appendMedia({
                src: [video_src],
                link,
                postId,
                index,
                type: { iframeEmbed: videoObj },
            });
            mediaContainerInsert(iframe, link, postId, index);
        }
    },

    createTwitch(link, videoObj, postId, index) {
        let video_id = videoObj.video;
        let video_channel = videoObj.channel;
        let video_collection = videoObj.collection;
        let video_clip = videoObj.clip;
        let timeOffset = videoObj.offset || 0;

        let video_src;
        if (video_id)
            video_src = `https://player.twitch.tv/?video=v${video_id}&autoplay=true&muted=false&t=${timeOffset}`;
        else if (video_channel)
            video_src = `https://player.twitch.tv/?channel=${video_channel}&autoplay=true&muted=false`;
        else if (video_collection)
            video_src = `https://player.twitch.tv/?collection=${video_collection}&autoplay=true&muted=false`;
        else if (video_clip) video_src = `https://clips.twitch.tv/embed?clip=${video_clip}&autoplay=true&muted=false`;

        if (video_src) {
            let iframe = appendMedia({
                src: [video_src],
                link,
                postId,
                index,
                type: { iframeEmbed: videoObj },
            });
            mediaContainerInsert(iframe, link, postId, index);
        }
    },
};

export default VideoLoader;
