settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("image_loader"))
    {
        ImageLoader =
        {
            imgurApiBaseUrl: "https://api.imgur.com/3/image",

            imgurClientId: "Client-ID c045579f61fc802",

            loadImages: function(item)
            {
                var links = item.querySelectorAll(".sel .postbody a");
                for (var i = 0; i < links.length; i++) {
                    if (ImageLoader.isVideo(links[i].href) || ImageLoader.isImage(links[i].href)) {
                        // pass our loop position and add an expando button for every hooked link
                        ((i) => {
                            if (links[i].querySelector("div.expando")) { return; }
                            links[i].addEventListener("click", e => {
                               ImageLoader.toggleImage(e, i);
                            });

                            var _postBody = links[i].parentNode;
                            var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })(i);
                    }
                }
            },

            isVideo: function(href)
            {
                if (/https?\:\/\/(?:i\.|m\.|www\.)?imgur.com\/(?:.*\/|.*\/.*\/)?([\w\d\-]+)(\.[webmpng4jgifv]+)?/.test(href) ||
                    /https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.test(href) ||
                    /https?\:\/\/giphy.com\/(?:embed\/([A-Za-z0-9]+)|gifs\/.*\-([A-Za-z0-9]+))/.test(href))
                    return true;

                return false;
            },

            isImage: function(href)
            {
                // some urls don't end in jpeg/png/etc so the normal test won't work
                if (/https?\:\/\/picasaweb\.google\.com\/\w+\/.*#\d+$/.test(href) ||
                    /https?\:\/\/yfrog.com\/\w+$/.test(href) ||
                    /https?\:\/\/twitpic.com\/\w+$/.test(href) ||
                    /https?\:\/\/pbs\.twimg\.com\/media\/[\w\-\.]+/.test(href) ||
                    /https?\:\/\/pichars.org\/\w+$/.test(href) ||
                    /https?\:\/\/www.dropbox.com\/s\/.+/.test(href))
                    return true;

                return ImageLoader.getImageUrl(href).match(/\/[^:?]+\.(jpg|jpeg|png|gif|bmp|svg)$/i);
            },

            getImageUrl: function(href)
            {
                // change shackpics to chattypics
                if (/shackpics\.com/.test(href))
                {
                    href = href.replace(/shackpics\.com/, 'chattypics.com');
                    if (/chattypics\.com\/viewer\.x/.test(href))
                        href = href.replace(/viewer\.x/, 'viewer.php');
                }

                // change shackpics image page into image
                if (/chattypics\.com\/viewer\.php/.test(href))
                    return href.replace(/viewer\.php\?file=/, 'files/');

                // change fukung image page into image
                if (/https?\:\/\/(www\.)?fukung\.net\/v\/\d+\//.test(href))
                    return href.replace(/(www\.)?fukung\.net\/v\/\d+\//, 'media.fukung.net/imgs/');

                if (/https?\:\/\/yfrog.com\/\w+$/.test(href))
                    return href + ":iphone";

                // no way to get the full image for twitpic, just how a thumbnail
                if ((m = /https?\:\/\/twitpic.com\/(\w+)$/.exec(href)) != null)
                    return "https://twitpic.com/show/thumb/" + m[1];
                else if ((m = /https?\:\/\/pbs\.twimg\.com\/media\/([\w\-\.]+)/.exec(href)) != null)
                    return "https://pbs.twimg.com/media/" + m[1];

                // grab the username and the photo id
                if ((m = /https?\:\/\/picasaweb\.google\.com\/(\w+)\/.*#(\d+)$/.exec(href)) != null)
                    return "https://picasaweb.google.com/data/media/api/user/" + m[1] + "/photoid/" + m[2];

                // pichars images are in the in the /store/ directory with the same name
                if (/https?\:\/\/pichars.org\/\w+$/.test(href) && !/https\:\/\/pichars.org\/store\/\w+$/.test(href))
                    return href.replace(/org/, 'org/store');

                // new dropbox sharing links can be viewed directly by setting the "dl" flag
                if (/https?\:\/\/www.dropbox.com\/s\/.+/.test(href) && !/dl=1$/.test(href))
                    return href.replace("?dl=0","") + "?dl=1";

                // not a special case, just use the link's href
                return href;
            },

            toggleImage: function(e, index)
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

                    if (ImageLoader.isVideo(link.href))
                    {
                        if (link.href.match(/imgur/))
                            ImageLoader.createImgur(link, _postId, index);
                        else if (link.href.match(/gfycat/))
                            ImageLoader.createGfycat(link, _postId ,index);
                        else if (link.href.match(/giphy/))
                            ImageLoader.createGiphy(link, _postId, index);
                    }
                    else
                    {
                        // use HTTPS to better conform to CORS rules
                        // NOTE: ShackPics needs SSL fixes before uncommenting this!
                        // image.src = ImageLoader.getImageUrl(link.href).replace(/http\:\/\//i, "https://");
                        var src = ImageLoader.getImageUrl(link.href);
                        ImageLoader.appendMedia(src, link, _postId, index);
                    }
                }
            },

            createImgur: async function(link, postId, index)
            {
                var _link = link.href.replace(/http\:\/\//, "https://");
                var _match = /https?\:\/\/(?:i\.|m\.|www\.)?imgur.com\/(?:gallery\/([\w\d\-]+)|a\/|t\/([\w\d\-]+)\/)?([\w\d\-]+)?(\.[webmpng4jgifv]+)?/.exec(_link);
                var _imgur = _match && {
                    gallery: _match[1] || _match[2],
                    id: _match[3],
                    ext: _match[4]
                };

                // attempt to resolve if we can otherwise use the response method
                if (_imgur && _imgur.id && _imgur.ext || /\.com\/([\w\d\-]{7})$/i.test(_match[0])) {
                    resolveImage(_imgur.id);
                } else if (_imgur && _imgur.id && /\.com\/a\//i.test(_match[0])) {
                    // fallback to parsing because of imgur's awful album api
                    var src = await resolveParse(_match[0]);
                    if (src)
                        ImageLoader.appendMedia(src, link, postId, index);
                    else
                        throw Error(`Can't resolve imgur album image for: ${_match[0]}`);
                } else if (_imgur && !_imgur.ext) {
                    resolveGallery(_match[0]);
                }

                function resolveImage(hash) {
                    xhrRequest(`${ImageLoader.imgurApiBaseUrl}/${hash}`,
                        { headers: new Map().set("Authorization", ImageLoader.imgurClientId)
                    }).then(async res => {
                        // verify the hash to be sure this is valid
                        var response = await res.json();
                        var data = response.data;
                        var src = data && data.mp4 || data.webm || data.link;
                        if (src)
                           ImageLoader.appendMedia(src, link, postId, index);
                        else
                            throw Error(`Can't resolve imgur link for: ${_match[0]}`);
                    }).catch(err => { console.log(err); });
                };
                function resolveGallery(url) {
                    // use the json response method to resolve the gallery item
                    xhrRequest(`${url}.json`).then(async res => {
                        var response = await res;
                        if (res.status === 404) {
                            // try resolving gallery item by parse if get an initial 404
                            var src = await resolveParse(url);
                            if (src)
                                ImageLoader.appendMedia(src, link, postId, index);
                            else
                                throw Error(`Can't resolve imgur gallery image for: ${_match[0]}`);
                        } else if (res.ok) { response = await res.json(); }
                        var data = response && response.data.image;
                        if (data.album_images == null && data.ext && data.hash) {
                            // this "gallery" has file data so let's use it
                            resolveImage(data.hash);
                        }
                        else if (data.album_images != null && data.album_images.images.length > 0) {
                            // no hash + ext so try albums
                            var src = data.album_images.images[0];
                            if (src && src.hash && src.ext)
                                resolveImage(src.hash);
                            else
                                throw Error(`Can't resolve hash for imgur link: ${_match[0]}`);
                        } else if (data.galleryTags != null && data.galleryTags.length > 0) {
                            // fallback to resolving from the gallery hash
                            var src = data.galleryTags[0].hash;
                            if (src)
                                resolveImage(src);
                            else
                                throw Error(`Failed to resolve hash data for imgur gallery: ${_match[0]}`);
                        }
                        else { throw Error(`Can't find gallery item data for: ${_match[0]}`); }
                    }).catch(err => { console.log(err); });
                };
                function resolveParse(url) {
                    return new Promise((resolve, reject) => {
                        xhrRequest(url).then(async res => {
                            var response = await res.text();
                            var match = /<meta.*\"og\:(?:video\".*=\"([\w\.\-\d\/\:]+)|image\".*=\"([\w\.\-\d\/\:]+))/i.exec(response);
                            // prefer video over static media
                            if (match != null && match[1] != null)
                                resolve(match[1]);
                            else if (match != null && match[2] != null)
                                resolve(match[2]);
                            else
                                reject();
                        }).catch(err => { console.log(err); });
                    }).catch(err => { console.log(err); });
                };
            },

            createGfycat: function(link, postId, index)
            {
                var _match = /https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.exec(link.href);
                var video_id = _match && _match[1];

                // ask the gfycat api for the embed url (doubles as verification of content)
                xhrRequest(`https://api.gfycat.com/v1/gfycats/${video_id}`,
                    { headers: new Map().set("Authorization", ImageLoader.imgurClientId) }
                ).then(async res => {
                    // use the mobile mp4 embed url (usually smallest)
                    var jsonData = await res.json();
                    var src = jsonData && jsonData.gfyItem.mobileUrl;
                    if (src)
                        ImageLoader.appendMedia(src, link, postId, index);
                    else { throw Error(); }
                }).catch(err => { console.log(err); });
            },

            createGiphy: function(link, postId, index)
            {
                var _matchGiphy = /https?\:\/\/giphy.com\/(?:embed\/([A-Za-z0-9]+)|gifs\/.*\-([A-Za-z0-9]+))/i.exec(link.href);
                var _giphyId = _matchGiphy && _matchGiphy[1] || _matchGiphy[2];

                if (_giphyId) {
                    var src = `https://media2.giphy.com/media/${_giphyId}/giphy.mp4`;
                    ImageLoader.appendMedia(v, src, link, postId, index);
                } else { console.log(`An error occurred parsing the Giphy url: ${href}`) }
            },

            appendMedia: function(src, link, postId, index) {
                var mediaElem = document.createElement("div");
                mediaElem.setAttribute("class", "imageloader grid-item hidden");

                var _animExt = src.match(/\.(mp4|gifv|webm)/i);
                var _staticExt = src.match(/\.(jpe?g|gif|png)/i);
                var _elem;
                if (_animExt) {
                    _elem = document.createElement("video");
                    _elem.setAttribute("autoplay", "");
                    _elem.setAttribute("muted", "");
                    _elem.setAttribute("loop", "");
                }
                else if (_staticExt)
                    _elem  = document.createElement("img");

                _elem.setAttribute("id", `loader_${postId}-${index}`);
                _elem.setAttribute("src", src);
                mediaElem.appendChild(_elem);
                mediaContainerInsert(mediaElem, link, postId, index);
            }
        }

        processPostEvent.addHandler(ImageLoader.loadImages);
    }
});
