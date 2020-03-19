import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";
import { objContains, fetchSafe, fetchSafeLegacy } from "../core/common";
import { processExpandoLinks, toggleMediaItem, appendMedia } from "../core/media_helpers";

interface ImgurResponse {
    data: {
        images?: Array<{
            mp4?: string;
            link?: string;
        }>;
        mp4?: string;
        link?: string;
    };
}

interface GfycatResponse {
    gfyItem: {
        mobileUrl: string;
    };
}

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
    imgRegex: /https?:\/\/(?:.+?\.)?.+?\..+?\/(?:.*?\/)?(?:.+[=])?([\w*@#$%^_&!()[\]{}'-]+\.(png|jpe?g|webp|gif))([&?].+?$|\w+)?/i,
    vidRegex: /https?:\/\/(?:.+?\.)?.+?\..+?\/(?:.*?\/)?(?:.+[=])?([\w@#$%^_&!()[\]{}'-]+\.(mp4|gifv|webm))([&?].+?$|\w+)?/i,
    // common media host patterns
    imgurRegex: /https?:\/\/(?:.+?\.)?imgur\.com\/(?:.+?\/)*([\w-]+)(?:#([\w-]+))?/i,
    gfycatRegex: /https?:\/\/(?:.*?\.)?gfycat.com\/(?:.*\/([\w]+)|([\w]+)|([\w]+)-.*?)/i,
    giphyRegex: /https?:\/\/(?:.*?\.)?giphy.com\/(?:embed\/|gifs\/|media\/)(?:.*-)?([\w-]+)/i,
    tenorRegex: /https:\/\/(tenor\.com\/view\/[\w-]+?(\d{7,})|media\.tenor\.com\/videos\/(\w{32})\/(mp4|webm))/i,
    dropboxImgRegex: /https?:\/\/(?:.*?\.)?dropbox\.com\/s\/.+(?:png|jpe?g|gif|webp)\\?/i,
    dropboxVidRegex: /https?:\/\/(?:.*?\.)?dropbox\.com\/s\/.+(?:mp4|gifv|webm)\\?/i,
    // common image host patterns
    chattypicsRegex1: /https?:\/\/(?:.*?\.)?chattypics\.com\/viewer\.php/i,
    chattypicsRegex2: /https?:\/\/chattypics\.com\/files\/.*\.jpe?g/i,
    twimgRegex: /(https?:\/\/pbs\.twimg\.com\/media\/)(?:([\w-]+)\?format=([\w]+)&?|([\w-.]+))?/i,

    async install() {
        return enabledContains("image_loader").then((res) => {
            if (res) processPostEvent.addHandler(ImageLoader.loadImages);
        });
    },

    loadImages(item) {
        let links = [...item.querySelectorAll(".sel .postbody a")];
        if (links) processExpandoLinks(links, ImageLoader.getMediaType, ImageLoader.toggleImage);
    },

    getMediaType(href) {
        const isVideo = (url) => {
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
        const getImageUrl = (url) => {
            // change shackpics to chattypics
            let m;
            if (/shackpics\.com/.test(href)) {
                url = url.replace(/shackpics\.com/, "chattypics.com");
                if (/chattypics\.com\/viewer\.x/.test(url)) url = url.replace(/viewer\.x/, "viewer.php");
                return url;
            }
            // change shackpics image page into image
            else if (ImageLoader.chattypicsRegex1.test(url)) return url.replace(/viewer\.php\?file=/, "files/");
            else if (ImageLoader.chattypicsRegex2.test(url)) return url.replace("http:", "https:");
            // force HTTPS Chattypics fetches
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
        const isImage = (url) => {
            // some urls don't end in jpeg/png/etc so the normal test won't work
            let src = getImageUrl(url);
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

    toggleImage(e, parsedPost, postId, index) {
        // left click only
        if (e.button == 0) {
            e.preventDefault();
            let _expandoClicked = e.target.classList !== undefined && objContains("expando", e.target.classList);
            let link = _expandoClicked ? e.target.parentNode : e.target;
            let src;
            if (toggleMediaItem(link)) return;
            if (parsedPost && parsedPost.type === 2 && parsedPost.src) {
                if (parsedPost.src.match(/imgur/)) ImageLoader.createImgur(link, postId, index);
                else if (parsedPost.src.match(/gfycat/)) ImageLoader.createGfycat(link, postId, index);
                else if (parsedPost.src.match(/giphy/)) ImageLoader.createGiphy(link, postId, index);
                else if (parsedPost.src.match(/dropbox/)) ImageLoader.createDropboxVid(link, postId, index);
                else if (parsedPost.src.match(/tenor/)) ImageLoader.createTenor(link, postId, index);
                else if ((src = ImageLoader.vidRegex.exec(link.href)) !== null) {
                    appendMedia({
                        src: [src[0]],
                        link,
                        postId,
                        index,
                        type: { forceAppend: true },
                    });
                }
            } else if (parsedPost && parsedPost.type === 1 && parsedPost.src) {
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

    createDropboxVid(link, postId, index) {
        let src = [link.href.replace(/\?dl=0/i, "") + "?raw=1"];
        appendMedia({
            src,
            link,
            postId,
            index,
            type: { forceAppend: true },
        });
    },

    async createImgur(link, postId, index) {
        const fetchImgur = (url) => {
            // sanitized in common.js!
            return fetchSafe({
                url,
                fetchOpts: {
                    headers: { Authorization: "Client-ID c045579f61fc802" },
                },
            })
                .then((response: ImgurResponse) => {
                    let _media = response && response.data;
                    let _items =
                        response && Array.isArray(_media.images || _media) ? _media.images : _media.mp4 || _media.link;
                    if (Array.isArray(_items) && _items.length > 0) {
                        let _media = [];
                        for (let i of _items || []) if (!!i.mp4 || !!i.link) _media.push(i.mp4 || i.link);

                        return _media;
                    } else if (_items) return [_items];
                })
                .catch((err) => console.log("Imgur resolution failure:", err.status || err));
        };

        // resolve media shortcodes with failover (album-image > album > image)
        // causes some unnecessary fetches due to Imgur API silliness
        let _matchShortcode = ImageLoader.imgurRegex.exec(link.href);
        let albumHash = _matchShortcode && _matchShortcode[1];
        let imageHash = _matchShortcode && _matchShortcode[2];
        let _imageUrl = albumHash && !imageHash && `https://api.imgur.com/3/image/${albumHash}`;
        let _albumUrl = _imageUrl && _imageUrl.replace(/\/image\//, "/album/");
        let _albumImageUrl = imageHash && albumHash && `https://api.imgur.com/3/album/${albumHash}/image/${imageHash}`;

        if (_matchShortcode) {
            // resolver priority: album-image > image > album
            let _image = _imageUrl && (await fetchImgur(_imageUrl));
            let _album = _albumUrl && (await fetchImgur(_albumUrl));
            let _albumImage = _albumImageUrl && (await fetchImgur(_albumImageUrl));
            if (
                (_albumImage && _albumImage.length > 0) ||
                (_image && _image.length > 0) ||
                (_album && _album.length > 0)
            ) {
                appendMedia({
                    src: _albumImage || _image || _album,
                    link,
                    postId,
                    index,
                    type: { forceAppend: true },
                });
            } else throw new Error(`Could not resolve Imgur shortcode from: ${link}`);
        }
    },

    async createGfycat(link, postId, index) {
        let _match = ImageLoader.gfycatRegex.exec(link.href);
        // we can match against both direct and indirect links
        let gfycat_id = (_match && _match[1]) || _match[2];

        if (gfycat_id) {
            let url = `https://api.gfycat.com/v1/gfycats/${gfycat_id}`;
            if (window.chrome) {
                fetchSafe({ url }).then((json: GfycatResponse) => {
                    // sanitized in common.js!
                    if (json && json.gfyItem.mobileUrl != null) {
                        appendMedia({
                            src: [json.gfyItem.mobileUrl],
                            link,
                            postId,
                            index,
                            type: { forceAppend: true },
                        });
                    } else throw new Error(`Failed to get Gfycat object: ${link.href} = ${gfycat_id}`);
                });
            } else {
                // fallback to older XHR method for Firefox for this endpoint
                fetchSafeLegacy({ url })
                    .then((json: GfycatResponse) => {
                        // sanitized in common.js!
                        if (json && json.gfyItem.mobileUrl != null) {
                            appendMedia({
                                src: [json.gfyItem.mobileUrl],
                                link,
                                postId,
                                index,
                                type: { forceAppend: true },
                            });
                        } else throw new Error(`Failed to get Gfycat object: ${link.href} = ${gfycat_id}`);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        } else console.log(`An error occurred parsing the Gfycat url: ${link.href}`);
    },

    createGiphy(link, postId, index) {
        // only use the alphanumeric id without the label
        let _matchGiphy = ImageLoader.giphyRegex.exec(link.href);
        let _giphyId = _matchGiphy && _matchGiphy[1];

        if (_giphyId) {
            let src = [`https://media.giphy.com/media/${_giphyId}/giphy.mp4`];
            appendMedia({
                src,
                link,
                postId,
                index,
                type: { forceAppend: true },
            });
        } else console.log(`An error occurred parsing the Giphy url: ${link.href}`);
    },

    async resolveTenor(mediaId) {
        let __obf = atob("UE9JODJZS1NWRENQ");
        if (mediaId) {
            let response: TenorResponse = await fetchSafe({
                url: `https://api.tenor.com/v1/gifs?ids=${mediaId}&key=${__obf}&limit=1`,
            });
            let media = response && response.results[0].media[0].webm.url;
            return media;
        }
        return null;
    },

    async createTenor(link, postId, index) {
        // we only support Tenor WEBM/MP4/GIF links here
        let _matchTenor = ImageLoader.tenorRegex.exec(link.href);
        if (_matchTenor && _matchTenor[3]) {
            // Tenor WEBM/MP4 (skip resolver)
            let src = [_matchTenor[0]];
            appendMedia({
                src,
                link,
                postId,
                index,
                type: { forceAppend: true },
            });
        } else if (_matchTenor && _matchTenor[2]) {
            // Tenor GIF (resolve to WEBM)
            let src = await ImageLoader.resolveTenor(_matchTenor[2]);
            if (src) {
                appendMedia({
                    src,
                    link,
                    postId,
                    index,
                    type: { forceAppend: true },
                });
            }
        } else console.log(`An error occurred parsing the Tenor url: ${link.href}`);
    },
};

export default ImageLoader;
