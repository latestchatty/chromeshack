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
                if (/https?\:\/\/(?:i\.|m\.|www\.)?imgur.com\/(?:.*\/|.*\/.*\/)?([\w\d\-]+)(\.[webmpng4jgifv]+)?/.test(href) ||
                    /https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.test(href) ||
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
                var _isImgur = /https?\:\/\/i.imgur.com\/[\w\d]+\.[gifvwebmp4ngj]+$/i.test(_link);
                if (_link.length > 0 && _isImgur) {
                    // we've already got what we need so use it
                    var _src = _link.replace(/\.[gifvwebmp4]+$/i, ".mp4");
                    ImageLoader.appendMedia(_src, link, postId, index);
                }
                else if (_link.length > 0) {
                    var _parsedObj = await parseImgur(_link);
                    resolveImage(_parsedObj);
                }

                function resolveImage(imgurObj) {
                    if (imgurObj && imgurObj.src != null) {
                        ImageLoader.appendMedia(imgurObj.src, link, postId, index);
                    } else { console.log("Something went wrong when appending Imgur object!"); }
                }
                function parseImgur(url) {
                    return new Promise(resolve => {
                        xhrRequest(url).then(async res => {
                            if (res.ok) {
                                var response = await res.text();
                                var _staticMatch = /og\:image\".+?=\"([\w\d\:\-\.\/]+).*?\"/i.exec(response);
                                var _vidMatch = /og\:video\".+?=\"([\w\d\:\-\.\/]+).*?\"/i.exec(response);
                                // prefer video over static media
                                if (_vidMatch != null)
                                    resolve({ src: _vidMatch[1], type: 1 });
                                else if (_staticMatch != null)
                                    resolve({ src: _staticMatch[1], type: 2 });
                                else
                                    throw new Error(`Unable to parse Imgur link: ${url}`);
                            } else { throw new Error(`An error occurred fetching Imgur url: ${link.href} = ${res.status}: ${res.statusText}`); }
                        }).catch(err => { console.log(err); });
                    });
                };
            },

            createGfycat: function(link, postId, index)
            {
                var _match = /https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.exec(link.href);
                var gfycat_id = _match && _match[1];

                if (gfycat_id) {
                    xhrRequest(link.href).then(async res => {
                        if (res.ok) {
                            var response = await res.text();
                            // parse the website for the mobile mp4 link (smallest, works even for static uploads)
                            var _matchGfycat = /\"og:video".+?content=\"(.*?)\".*?\/>/i.exec(response);
                            if (_matchGfycat == null) { throw new Error(`Failed to parse Gfycat for mobile link: ${link.href}`); }
                            var src = _matchGfycat != null && _matchGfycat[1];
                            ImageLoader.appendMedia(src, link, postId, index);
                        } else { throw new Error(`An error occurred fetching Gfycat url: ${link.href} = ${res.status}: ${res.statusText}`); }
                    }).catch(err => { console.log(err); });
                } else { console.log(`An error occurred parsing the Gfycat url: ${link.href}`); }
            },

            createGiphy: function(link, postId, index)
            {
                // only use the alphanumeric id without the label
                var _matchGiphy = /https?\:\/\/(?:.*\.)?giphy.com\/(?:embed\/|gifs\/)(?:.*\-)?([\w\d\-]+)/igm.exec(link.href);
                var _giphyId = _matchGiphy && _matchGiphy[1];

                if (_giphyId) {
                    var src = `https://media2.giphy.com/media/${_giphyId}/giphy.mp4`;
                    ImageLoader.appendMedia(src, link, postId, index);
                } else { console.log(`An error occurred parsing the Giphy url: ${link.href}`); }
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
