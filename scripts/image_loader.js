settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("image_loader"))
    {
        ImageLoader =
        {
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
                if (/https?\:\/\/(?:.*?\.)?imgur.com\/(?:.+?\/.+?\/|.+?\/)?[\w\d\-]+/.test(href) ||
                    /https?\:\/\/(?:.*?\.)?gfycat.com\/(?:[\w]+|[\w]+\-.*?)/.test(href) ||
                    /https?\:\/\/(?:.*\.)?giphy.com\/(?:embed\/|gifs\/)[\w\d\-]+/.test(href))
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
                else if ((m = /(https?\:\/\/pbs\.twimg\.com\/media\/)(?:([\w\-]+)\?format=([\w]+)\&|([\w\-\.]+))?/.exec(href)) != null) {
                    if (m[3] != null) { return `${m[1]}${m[4] || m[2]}\.${m[3]}` }
                    else { return `${m[1]}${m[4] || m[2]}`; }
                }

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
                        appendMedia(src, link, _postId, index);
                    }
                }
            },

            createImgur: async function(link, postId, index)
            {
                var authHdr = "Client-ID c045579f61fc802";
                var _link = link.href.replace(/http\:\/\//, "https://");
                var _matchShortcode = /https?\:\/\/(?:.+?\.)?imgur.com\/(?:a\/(\w+)|t\/.+?\/(\w+)|gallery\/(\w+))?(\w+)?/i.exec(_link);
                var albumShortcode = _matchShortcode[1] || _matchShortcode[2] || _matchShortcode[3];
                var imageShortcode = _matchShortcode[4] || _matchShortcode[3];

                if (_link.length > 0 && _matchShortcode != null) {
                    // resolve by album otherwise fallback to resolving by image
                    var imgurAlbum = albumShortcode != null && await resolveImgurAlbum(albumShortcode);
                    var imgurImage = imageShortcode != null && await resolveImgur(imageShortcode);
                    if (imgurAlbum != null && imgurAlbum.length > 0)
                        appendMedia(imgurAlbum, link, postId, index);
                    else if (imgurImage != null)
                        appendMedia(imgurImage, link, postId, index);
                    else
                        throw new Error(`Could not resolve Imgur shortcode from: ${_link}`);
                }

                function resolveImgur(shortcode) {
                    var url = `https://api.imgur.com/3/image/${shortcode}`;
                    return new Promise(resolve => {
                        fetchImgur(url).then(json => {
                            if (json.status !== 404) {
                                if (json && json.data.mp4 != null)
                                    resolve(json.data.mp4);
                                else if (json && json.data.link != null)
                                    resolve(json.data.link);
                            } else { resolve(null); }
                        });
                    });
                };
                function resolveImgurAlbum(shortcode) {
                    //var shortcode = "oo0Ptek"; // multi-item test
                    var url = `https://api.imgur.com/3/album/${shortcode}`;
                    return new Promise(resolve => {
                        fetchImgur(url).then(json => {
                            if (json.status !== 404) {
                                var collector = [];
                                if (json && json.data.images != null && json.data.images.length > 0) {
                                    json.data.images.forEach(item => {
                                        if (item.mp4 != null)
                                            collector.push(item.mp4);
                                        else if (item.link != null)
                                            collector.push(item.link);
                                    });
                                    resolve(collector);
                                } else { console.log(`Unable to find any Imgur media items for: ${url}`); }
                            } else { resolve(null); }
                        });
                    });
                };
                function fetchImgur(url) {
                    return xhrRequest(url, { headers: new Map().set("Authorization", authHdr) })
                        .then(async res => await res.json())
                        .catch(err => { console.log(err); });
                }
            },

            createGfycat: async function(link, postId, index)
            {
                var _link = link.href.replace(/http\:\/\//, "https://");
                var _match = /https?\:\/\/(?:.*?\.)?gfycat.com\/(?:([\w]+)|([\w]+)\-.*?)/.exec(_link);
                // we can match against both direct and indirect links
                var gfycat_id = _match && _match[1] || _match[2];
                var gfycatKey = await getGfycatCredentials();

                if (gfycat_id) {
                    var url = `https://api.gfycat.com/v1/gfycats/${gfycat_id}`;
                    if (!!window.chrome) {
                        xhrRequest(url, {
                            headers: new Map().set("Authorization", gfycatKey)
                        }).then(async res => {
                            var json = await res.json();
                            if (json && json.gfyItem.mobileUrl != null) {
                                appendMedia(json.gfyItem.mobileUrl, link, postId, index);
                            } else { throw new Error(`Failed to get Gfycat object: ${link.href} = ${gfycat_id}`); }
                        }).catch(err => { console.log(err); });
                    } else {
                        // fallback to older XHR method for Firefox for this endpoint
                        xhrRequestLegacy(url, {
                            headers: new Map().set("Authorization", gfycatKey)
                        }).then(res => {
                            var json = JSON.parse(res);
                            if (json && json.gfyItem.mobileUrl != null) {
                                appendMedia(json.gfyItem.mobileUrl, link, postId, index);
                            } else { throw new Error(`Failed to get Gfycat object: ${link.href} = ${gfycat_id}`); }
                        }).catch(err => { console.log(err); });
                    }
                } else { console.log(`An error occurred parsing the Gfycat url: ${link.href}`); }

                function getGfycatCredentials() {
                    var sessionKey = sessionStorage.getItem("gfycatKey");
                    if (!sessionKey) {
                        var __obf = {
                            "grant_type": "client_credentials",
                            "client_secret": atob("OERaNnZUeURMZWUzWk5pR3B3Snd0aXV4NnJNYVlWQXF4OFV2N0Y4c01NUjBla1NlUXdNWGNuWTF5MGdNSVk1Sg=="),
                            "client_id": atob("Ml9nV3Nkb0s=")
                        };
                        return new Promise(resolve => {
                            postXHR("https://api.gfycat.com/v1/oauth/token", JSON.stringify(__obf))
                            .then(async res => {
                                var json = await res.json();
                                if (json.access_token != null && json.access_token.length > 0) {
                                    sessionStorage.setItem("gfycatKey", json.access_token);
                                    resolve(json.access_token);
                                } else
                                    resolve();
                            });
                        }).catch(err => { console.log(err); });
                    }
                    return sessionKey;
                }
            },

            createGiphy: function(link, postId, index)
            {
                // only use the alphanumeric id without the label
                var _matchGiphy = /https?\:\/\/(?:.*\.)?giphy.com\/(?:embed\/|gifs\/)(?:.*\-)?([\w\d\-]+)/igm.exec(link.href);
                var _giphyId = _matchGiphy && _matchGiphy[1];

                if (_giphyId) {
                    var src = `https://media2.giphy.com/media/${_giphyId}/giphy.mp4`;
                    appendMedia(src, link, postId, index);
                } else { console.log(`An error occurred parsing the Giphy url: ${link.href}`); }
            },
        }

        processPostEvent.addHandler(ImageLoader.loadImages);
    }
});
