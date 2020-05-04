import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { objContains, fetchSafe, isImage, isVideo } from "../core/common";
import { processExpandoLinks, toggleMediaItem, appendMedia } from "../core/media_helpers";

import { doResolveGfycat } from "../core/api/gfycat";
import { doResolveImgur } from "../core/api/imgur";

interface TenorResponse {
    results?: Array<{
        media: Array<{
            webm: {
                url: string;
            };
        }>;
    }>;
}

const ImageLoader = {
    // general media detection patterns
    imgRegex: /https?:\/\/(?:.+?\.)?.+?\..+?\/(?:.*?\/)?(?:.+[=])?([\w\-._@#$%^&!()[\]{}']+\.(png|jpe?g|webp|gif))([&?].+?$|\w+)?/i,
    vidRegex: /https?:\/\/(?:.+?\.)?.+?\..+?\/(?:.*?\/)?(?:.+[=])?([\w\-._@#$%^&!()[\]{}']+\.(mp4|gifv|webm))([&?].+?$|\w+)?/i,
    // common media host patterns
    imgurRegex: /https?:\/\/(?:.+?\.)?imgur\.com\/(?:(?:i\/)?(\w+?)\b\.|(?:album|gallery|a|g)\/(\w+)(?:#(\w+))?|.+\/([\w-]+)?|(\w+)$)?/i,
    gfycatRegex: /https?:\/\/(?:.*?\.)?gfycat.com\/(?:.*\/([\w]+)|([\w]+)|([\w]+)-.*?)/i,
    giphyRegex: /https?:\/\/(?:.*?\.)?giphy.com\/(?:embed\/|gifs\/|media\/)(?:.*-)?([\w-]+)/i,
    tenorRegex: /https:\/\/(tenor\.com\/view\/[\w-]+?(\d{7,})|media\.tenor\.com\/videos\/(\w{32})\/(mp4|webm))/i,
    dropboxImgRegex: /https?:\/\/(?:.*?\.)?dropbox\.com\/s\/.+(?:png|jpe?g|gif|webp)\\?/i,
    dropboxVidRegex: /https?:\/\/(?:.*?\.)?dropbox\.com\/s\/.+(?:mp4|gifv|webm)\\?/i,
    // common image host patterns
    chattypicsRegex1: /https?:\/\/(?:.*?\.)?chattypics\.com\/viewer\.php/i,
    chattypicsRegex2: /https?:\/\/chattypics\.com\/files\/.*\.(png|jpe?g|gif|webp)/i,
    twimgRegex: /(https?:\/\/pbs\.twimg\.com\/media\/)(?:([\w-]+)\?format=([\w]+)&?|([\w-.]+))?/i,

    async install() {
        const is_enabled = await enabledContains("image_loader");
        if (is_enabled) processPostEvent.addHandler(ImageLoader.loadImages);
    },

    loadImages(item: HTMLElement) {
        const links = [...item?.querySelectorAll(".sel .postbody a")] as HTMLAnchorElement[];
        if (links) processExpandoLinks(links, ImageLoader.getMediaType, ImageLoader.toggleImage);
    },

    getMediaType(href: string) {
        const isVideo = (url: string) => {
            if (
                ImageLoader.imgurRegex.test(url) ||
                ImageLoader.gfycatRegex.test(url) ||
                ImageLoader.giphyRegex.test(url) ||
                ImageLoader.dropboxVidRegex.test(url) ||
                ImageLoader.vidRegex.test(url) ||
                ImageLoader.tenorRegex.test(url)
            )
                return true;
            return false;
        };
        const getImageUrl = (url: string) => {
            // change shackpics to chattypics
            let m;
            if (/shackpics\.com/.test(href)) {
                url = url.replace(/shackpics\.com/, "chattypics.com");
                if (/chattypics\.com\/viewer\.x/.test(url)) url = url.replace(/viewer\.x/, "viewer.php");
                return url;
            }
            // change shackpics image page into image
            else if (ImageLoader.chattypicsRegex1.test(url)) return url.replace(/viewer\.php\?file=/, "files/");
            // force HTTPS Chattypics fetches
            if (ImageLoader.chattypicsRegex2.test(url)) return url.replace("http:", "https:");
            // distinguish between twitter cdn types
            else if ((m = ImageLoader.twimgRegex.exec(url)) !== null) {
                if (m[3]) return `${m[1]}${m[4] || m[2]}.${m[3]}`;
                else return `${m[1]}${m[4] || m[2]}`;
            }
            // dropbox sharing links can be viewed directly by setting the "raw" flag
            else if (ImageLoader.dropboxImgRegex.test(url) && !/raw=1$/.test(url))
                return url.replace(/\?dl=0/i, "") + "?raw=1";
            else if ((m = ImageLoader.imgRegex.exec(url)) !== null) return m[0] || url;
            return null;
        };
        const isImage = (url: string) => {
            // some urls don't end in jpeg/png/etc so the normal test won't work
            const src = getImageUrl(url);
            if (
                ImageLoader.twimgRegex.test(url) ||
                ImageLoader.dropboxImgRegex.test(url) ||
                (src && ImageLoader.imgRegex.test(url))
            )
                return true;
            return false;
        };

        if (isVideo(href)) return { type: 2, src: href };
        else if (isImage(href)) return { type: 1, src: [getImageUrl(href)] };
    },

    toggleImage(e: MouseEvent, parsedPost: any, postId: string, index: number) {
        // left click only
        if (e.button == 0) {
            e.preventDefault();
            const this_node = e?.target as HTMLElement;
            const _expandoClicked = this_node?.classList?.contains("expando");
            const link = (_expandoClicked ? this_node?.parentNode : this_node) as HTMLAnchorElement;
            const vid_src = ImageLoader.vidRegex.exec(link.href);
            if (toggleMediaItem(link)) return;
            if (parsedPost?.type === 2 && parsedPost?.src) {
                if (parsedPost?.src?.match(/imgur/)) ImageLoader.createImgur(link, postId, index);
                else if (parsedPost?.src?.match(/gfycat/)) ImageLoader.createGfycat(link, postId, index);
                else if (parsedPost?.src?.match(/giphy/)) ImageLoader.createGiphy(link, postId, index);
                else if (parsedPost?.src?.match(/dropbox/)) ImageLoader.createDropboxVid(link, postId, index);
                else if (parsedPost?.src?.match(/tenor/)) ImageLoader.createTenor(link, postId, index);
                else if (vid_src) {
                    appendMedia({
                        src: [vid_src[0]],
                        link,
                        postId,
                        index,
                        type: { forceAppend: true },
                    });
                }
            } else if (parsedPost?.type === 1 && parsedPost?.src) {
                appendMedia({
                    src: parsedPost.src,
                    link,
                    postId,
                    index,
                    type: { forceAppend: true },
                });
            } else throw Error(`Could not parse the given image link: ${link.href}`);
        }
    },

    createDropboxVid(link: HTMLAnchorElement, postId: string, index: number) {
        const src = [link.href.replace(/\?dl=0/i, "") + "?raw=1"];
        appendMedia({
            src,
            link,
            postId,
            index,
            type: { forceAppend: true },
        });
    },

    async createImgur(link: HTMLAnchorElement, postId: string, index: number) {
        const _image = isImage(link.href) ? link.href : null;
        const _video = isVideo(link.href) ? link.href : null;
        if (_image || _video) {
            return appendMedia({
                src: [_image || _video],
                link,
                postId,
                index,
                type: { forceAppend: true },
            });
        }

        // resolve media shortcodes with failover (album-image > album > image)
        // causes some unnecessary fetches due to Imgur API silliness
        const _m = ImageLoader.imgurRegex.exec(link.href);
        const albumId = _m[2] || _m[4];
        const imageId = _m[1] || _m[3] || _m[5];

        if (albumId || imageId) {
            // resolver priority: album-image > image > album
            const _imgur = await doResolveImgur({ imageId, albumId });
            if (_imgur) {
                appendMedia({
                    src: _imgur,
                    link,
                    postId,
                    index,
                    type: { forceAppend: true },
                });
            }
        }
    },

    async createGfycat(link: HTMLAnchorElement, postId: string, index: number) {
        const _match = ImageLoader.gfycatRegex.exec(link.href);
        // we can match against both direct and indirect links
        const gfycat_id = (_match && _match[1]) || (_match && _match[2]);

        if (gfycat_id) {
            const gfycat = await doResolveGfycat(gfycat_id);
            if (gfycat) {
                appendMedia({
                    src: gfycat,
                    link,
                    postId,
                    index,
                    type: { forceAppend: true },
                });
            }
        } else console.error(`An error occurred parsing the Gfycat url: ${link.href}`);
    },

    createGiphy(link: HTMLAnchorElement, postId: string, index: number) {
        // only use the alphanumeric id without the label
        const _matchGiphy = ImageLoader.giphyRegex.exec(link.href);
        const _giphyId = _matchGiphy && _matchGiphy[1];

        if (_giphyId) {
            const src = [`https://media.giphy.com/media/${_giphyId}/giphy.mp4`];
            appendMedia({
                src,
                link,
                postId,
                index,
                type: { forceAppend: true },
            });
        } else console.error(`An error occurred parsing the Giphy url: ${link.href}`);
    },

    async resolveTenor(mediaId: string) {
        const __obf = atob("UE9JODJZS1NWRENQ");
        if (mediaId) {
            const response: TenorResponse = await fetchSafe({
                url: `https://api.tenor.com/v1/gifs?ids=${mediaId}&key=${__obf}&limit=1`,
            });
            const media = response && response.results[0].media[0].webm.url;
            return media;
        }
        return null;
    },

    async createTenor(link: HTMLAnchorElement, postId: string, index: number) {
        // we only support Tenor WEBM/MP4/GIF links here
        const _matchTenor = ImageLoader.tenorRegex.exec(link.href);
        if (_matchTenor && _matchTenor[3]) {
            // Tenor WEBM/MP4 (skip resolver)
            const src = [_matchTenor[0]];
            appendMedia({
                src,
                link,
                postId,
                index,
                type: { forceAppend: true },
            });
        } else if (_matchTenor && _matchTenor[2]) {
            // Tenor GIF (resolve to WEBM)
            const src = await ImageLoader.resolveTenor(_matchTenor[2]);
            if (src) {
                appendMedia({
                    src,
                    link,
                    postId,
                    index,
                    type: { forceAppend: true },
                });
            }
        } else console.error(`An error occurred parsing the Tenor url: ${link.href}`);
    },
};

export default ImageLoader;
