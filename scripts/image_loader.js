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
                var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postbody.getElementsByTagName("a");

                for (var i = 0; i < links.length; i++)
                {
                    if (ImageLoader.isVideo(links[i].href) || ImageLoader.isImage(links[i].href)) {
                        // pass our loop position
                        (function(i) {
                            links[i].addEventListener("click", e => {
                                ImageLoader.toggleImage(e, i);
                            });
                        })(i);
                    }
                }
            },

            isVideo: function(href)
            {
                if (/https?\:\/\/(?:i\.|)?imgur.com(?!\/gallery\/|\/a\/)\/(\w+)/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/giphy.com\/(?:embed\/([A-Za-z0-9]+)|gifs\/.*\-([A-Za-z0-9]+))/.test(href))
                {
                    return true;
                }

                return false;
            },

            isImage: function(href)
            {
                // some urls don't end in jpeg/png/etc so the normal test won't work
                if (/https?\:\/\/picasaweb\.google\.com\/\w+\/.*#\d+$/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/yfrog.com\/\w+$/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/twitpic.com\/\w+$/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/pichars.org\/\w+$/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/www.dropbox.com\/s\/.+/.test(href))
                {
                    return true;
                }
                else
                {
                    href = ImageLoader.getImageUrl(href);
                    var imageRegex = /\/[^:?]+\.(jpg|jpeg|png|gif|bmp|svg)$/i;
                    return href.match(imageRegex);
                }
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
                    var link = e.target;
                    var _postBody = link.parentNode;
                    var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    // use our postId and index to find the link that was embedded
                    var _embedExists = _postBody.querySelector(`#image-loader_${_postId}-${index}`);
                    // toggle our embed if it's already open
                    if (_embedExists)
                        return _embedExists.classList.toggle("hidden");

                    if (ImageLoader.isVideo(link.href))
                    {
                        if (link.href.match(/imgur/))
                            ImageLoader.createImgur(link.href, _postBody, _postId, index);
                        else if (link.href.match(/gfycat/))
                            ImageLoader.createGfycat(link.href, _postBody, _postId, index);
                        else if (link.href.match(/giphy/))
                            ImageLoader.createGiphy(link.href, _postBody, _postId, index);
                    }
                    else
                    {
                        // use HTTPS to better conform to CORS rules
                        // NOTE: ShackPics needs SSL fixes before uncommenting this!
                        // image.src = ImageLoader.getImageUrl(link.href).replace(/http\:\/\//i, "https://");
                        var image = document.createElement("img");
                        image.setAttribute("src", ImageLoader.getImageUrl(link.href));
                        image.setAttribute("id", `image-loader_${_postId}-${index}`);
                        image.setAttribute("class", "imageloader");
                        ImageLoader.doContainerInsert(image, _postBody);
                    }
                }
            },

            doContainerInsert: function(elem, parentElem) {
                // try to acquire our existing container
                var container = parentElem.querySelector(".image-container");
                if (!container) {
                    container = document.createElement("div");
                    container.setAttribute("class", "image-container");
                }
                container.appendChild(elem);
                parentElem.appendChild(container);
            },

            createImgur: function(href, elem, postId, index)
            {
                // we exclude galleries explicitly
                var imgurName;
                if ((m = /https?\:\/\/(?:i\.|)?imgur.com(?!\/gallery\/|\/a\/)\/(\w+)/.exec(href)) != null)
                    imgurName = m[1];

                xhrRequest({
                    type: "GET",
                    url: `${ImageLoader.imgurApiBaseUrl}/${imgurName}`,
                    headers: new Map().set("Authorization", ImageLoader.imgurClientId),
                }).then(xhr => {
                    var response = JSON.parse(xhr).data;
                    if (response.id && response.animated) {
                        var v = document.createElement("video");
                        v.setAttribute("id", `image-loader_${postId}-${index}`);
                        v.setAttribute("class", "imageloader");
                        v.setAttribute("autoplay", "");
                        v.setAttribute("loop", "");
                        v.setAttribute("muted", "");
                        v.setAttribute("src", response.mp4);
                        ImageLoader.doContainerInsert(v, elem);
                    } else if (response.id) {
                        // force HTTPS for all static media to conform to CORS rules
                        var _link = response.link.replace(/http\:/, "https\:");
                        var i = document.createElement("img");
                        i.setAttribute("id", `image-loader_${postId}-${index}`);
                        i.setAttribute("class", "imageloader");
                        i.setAttribute("src", _link);
                        ImageLoader.doContainerInsert(i, elem);
                    }
                });
            },

            createGfycat: function(href, elem, postId, index)
            {
                var video_id;
                if ((m = /https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.exec(href)) != null)
                    video_id = m[1];

                // ask the gfycat api for the embed url (doubles as verification of content)
                xhrRequest({
                    type: "GET",
                    url: `https://api.gfycat.com/v1/gfycats/${video_id}`,
                    headers: new Map().set("Authorization", ImageLoader.imgurClientId),
                }).then(xhr => {
                    // use the mobile mp4 embed url (usually smallest)
                    var video_src = JSON.parse(xhr).gfyItem.mobileUrl || false;
                    if (video_src) {
                        var v = document.createElement("video");
                        v.setAttribute("id", `image-loader_${postId}-${index}`);
                        v.setAttribute("class", "imageloader");
                        v.setAttribute("autoplay", "");
                        v.setAttribute("loop", "");
                        v.setAttribute("muted", "");
                        v.setAttribute("src", video_src);
                        ImageLoader.doContainerInsert(v, elem);
                    }
                });
            },

            createGiphy: function(href, elem, postId, index)
            {
                var _isGiphy = /https?\:\/\/giphy.com\/(?:embed\/([A-Za-z0-9]+)|gifs\/.*\-([A-Za-z0-9]+))/i;
                var _matchGiphy = _isGiphy.exec(href);
                var _giphyId;
                if (_matchGiphy != null && _matchGiphy.length > 0)
                    _giphyId = _matchGiphy[1] || _matchGiphy[2];

                if (_giphyId) {
                    var video_src = `https://media2.giphy.com/media/${_giphyId}/giphy.mp4`;
                    var v = document.createElement("video");
                    v.setAttribute("id", `image-loader_${postId}-${index}`);
                    v.setAttribute("class", "imageloader");
                    v.setAttribute("src", video_src);
                    v.setAttribute("autoplay", "");
                    v.setAttribute("loop", "");
                    v.setAttribute("muted", "");
                    ImageLoader.doContainerInsert(v, elem);
                } else { console.log(`An error occurred parsing the Giphy url: ${href}`) }
            }
        }

        processPostEvent.addHandler(ImageLoader.loadImages);
    }
});
