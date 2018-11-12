settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("image_loader"))
    {
        ImageLoader =
        {
            imgurApiBaseUrl: "https://api.imgur.com/3/image",

            imgurClientId: "Client-ID c045579f61fc802",

            loadImages: function(item, id)
            {
                var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postbody.getElementsByTagName("a");

                for (var i = 0; i < links.length; i++)
                {
                    if (ImageLoader.isVideo(links[i].href) || ImageLoader.isImage(links[i].href))
                    {
                        links[i].addEventListener("click", ImageLoader.toggleImage);
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
                else if (/https?\:\/\/giphy\.com\/gifs\/\w+$/.test(href))
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

            getImgurDetails: function(imgurName) {
                try {
                    // ask the imgur api for endpoint embed data
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", `${ImageLoader.imgurApiBaseUrl}/${imgurName}`, false);
                    xhr.setRequestHeader("Authorization", ImageLoader.imgurClientId);
                    xhr.send();

                    var response = JSON.parse(xhr.responseText).data;
                    if (response.id) {
                        return {
                            // return an object with our details if we're successful
                            animated: response.animated,
                            height: response.height,
                            width: response.width,
                            link: response.mp4 || response.link,
                            id: response.id
                        };
                    }
                    return false;
                } catch (err) { console.log(err); }
            },

            toggleImage: function(e)
            {
                // left click only
                if (e.button == 0)
                {
                    var link = this;
                    if (link.childNodes[0].nodeName == "IMG" || link.childNodes[0].nodeName == "VIDEO")
                    {
                        // already showing image, collapse it
                        link.replaceHTML(link.href);
                    }
                    else
                    {
                        if (ImageLoader.isVideo(link.href))
                        {
                            var video = ImageLoader.createVideo(link.href);
                            link.removeChild(link.firstChild);
                            link.appendChild(video);
                        }
                        else
                        {
                            // image not showing, show it
                            var image = document.createElement("img");
                            image.src = ImageLoader.getImageUrl(link.href);
                            image.className = "imageloader";
                            link.removeChild(link.firstChild);
                            link.appendChild(image);
                        }

                    }
                    e.preventDefault();
                }
            },

            createVideo: function(href)
            {
                if (href.match(/imgur/))
                    return ImageLoader.createImgur(href);
                else if (href.match(/gfycat/))
                    return ImageLoader.createGfycat(href);
                else if (href.match(/giphy/))
                    return ImageLoader.createGiphy(href);
                return null;
            },

            createImgur: function(href)
            {
                // we exclude galleries explicitly
                var imgurName = /https?\:\/\/(?:i\.|)?imgur.com(?!\/gallery\/|\/a\/)\/(\w+)/.exec(href);
                var respObj = ImageLoader.getImgurDetails(imgurName[1]);
                if (respObj.animated) {
                    var v = document.createElement("video");
                    v.className = "imageloader";
                    v.setAttribute("autoplay", "");
                    v.setAttribute("loop", "");
                    v.setAttribute("muted", "");
                    v.setAttribute("src", respObj.link);
                    v.setAttribute("height", respObj.height);
                    v.setAttribute("width", respObj.width);
                    return v;
                } else {
                    var i = document.createElement("img");
                    i.className = "imageloader";
                    i.setAttribute("src", respObj.link);
                    i.setAttribute("height", respObj.height);
                    i.setAttribute("width", respObj.width);
                    return i;
                }
            },

            createGfycat: function(href)
            {
                var video_id;
                if ((m = /https?\:\/\/(?:\w+\.|)gfycat\.com\/(\w+)/.exec(href)) != null)
                    video_id = m[1];

                try {
                    // ask the gfycat api for the embed url (doubles as verification of content)
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", `https://api.gfycat.com/v1/gfycats/${video_id}`, false);
                    xhr.send();

                    // use the mobile mp4 embed url (usually smallest)
                    var video_src = JSON.parse(xhr.responseText).gfyItem.content_urls.mobile || false;
                    if (video_src) {
                        var v = document.createElement("video");
                        v.className = "imageloader";
                        v.setAttribute("autoplay", "");
                        v.setAttribute("loop", "");
                        v.setAttribute("muted", "");
                        v.setAttribute("src", video_src.url);
                        v.setAttribute("width", video_src.width);
                        v.setAttribute("height", video_src.height);
                        return v;
                    }
                    return false;
                } catch (err) { console.log(err); }
            },

            createGiphy: function(href)
            {
                var video_id;
                if ((m = /https?\:\/\/giphy\.com\/gifs\/(\w+)$/.exec(href)) != null)
                    video_id = m[1];

                var video_src = "https://media.giphy.com/media/" + video_id + "/giphy.mp4";

                var v = document.createElement("video");
                v.className = "imageloader";
                v.setAttribute("src", video_src);
                v.setAttribute("autoplay", "");
                v.setAttribute("loop", "");
                v.setAttribute("muted", "");
                return v;
            }
        }

        processPostEvent.addHandler(ImageLoader.loadImages);
    }
});
