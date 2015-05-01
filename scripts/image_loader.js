settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("image_loader"))
    {
        ImageLoader =
        {
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
                if (/https?\:\/\/(i\.)?imgur.com\/\w+\.gifv?$/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/(\w+\.)?gfycat\.com\/\w+(\.gif)?$/.test(href))
                {
                    return true;
                }
                else if (/https?\:\/\/giphy\.com\/gifs\/\w+$/.test(href))
                {
                    return true;
                }

                return false;
            },

            isImgurGifWithWrongExtension : function(href)
            {
                // detect imgur links that are actually gifs but are posted with the wrong extension (usually jpg)
                if (/https?\:\/\/(i\.)?imgur.com\/\w+\.\w+$/.test(href))
                {
                    // fix when viewing shacknews as https
                    if (window.location.protocol == "https:")
                        href = href.replace("http:", "https:");

                    // have to make a request to find out if the webm/mp4 is zippy/fat/giant
                    var xhr = new XMLHttpRequest();
                    xhr.open("HEAD", href, false);
                    xhr.send();

                    if (xhr.getResponseHeader("Content-Type") == "image/gif")
                        return true;
                }

                return false;
            },

            isImage: function(href)
            {
                // some urls don't end in jpeg/png/etc so the normal test won't work
                if (/http\:\/\/picasaweb\.google\.com\/\w+\/.*#\d+$/.test(href))
                {
                    return true;
                }
                else if (/http\:\/\/yfrog.com\/\w+$/.test(href))
                {
                    return true;
                }
                else if (/http\:\/\/twitpic.com\/\w+$/.test(href))
                {
                    return true;
                }
                else if (/http\:\/\/pichars.org\/\w+$/.test(href))
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
                if (/http\:\/\/(www\.)?fukung\.net\/v\/\d+\//.test(href))
                    return href.replace(/(www\.)?fukung\.net\/v\/\d+\//, 'media.fukung.net/imgs/');

                if (/http\:\/\/imgur.com\/\w+$/.test(href))
                    return href.replace(/imgur/, 'i.imgur') + ".jpg";

                if (/http\:\/\/yfrog.com\/\w+$/.test(href))
                    return href + ":iphone";

                // no way to get the full image for twitpic, just how a thumbnail
                if ((m = /http\:\/\/twitpic.com\/(\w+)$/.exec(href)) != null)
                    return "http://twitpic.com/show/thumb/" + m[1];

                // grab the username and the photo id
                if ((m = /http\:\/\/picasaweb\.google\.com\/(\w+)\/.*#(\d+)$/.exec(href)) != null)
                    return "http://picasaweb.google.com/data/media/api/user/" + m[1] + "/photoid/" + m[2];

                // pichars images are in the in the /store/ directory with the same name
                if (/http\:\/\/pichars.org\/\w+$/.test(href) && !/http\:\/\/pichars.org\/store\/\w+$/.test(href))
                    return href.replace(/org/, 'org/store');

                // new dropbox sharing links can be viewed directly by setting the "dl" flag
                if (/https?\:\/\/www.dropbox.com\/s\/.+/.test(href) && !/dl=1$/.test(href))
                    return href.replace("?dl=0","") + "?dl=1";

                // not a special case, just use the link's href
                return href;
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
                        link.innerHTML = link.href;
                    }
                    else
                    {
                        if (ImageLoader.isVideo(link.href) || ImageLoader.isImgurGifWithWrongExtension(link.href))
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
                    return ImageLoader.createGifv(href);
                else if (href.match(/gfycat/))
                    return ImageLoader.createGfycat(href);
                else if (href.match(/giphy/))
                    return ImageLoader.createGiphy(href);
                return null;
            },

            createGifv: function(href)
            {
                var video_id;
                
                if ((video_id = href.match(/i.imgur\.com\/(\w+)/i)))
                    video_id = video_id[1];
                else
                    return null;

                var v = document.createElement("video");
                v.className = "imageloader";
                v.setAttribute("src", "//i.imgur.com/" + video_id + ".mp4");
                v.setAttribute("autoplay", "");
                v.setAttribute("loop", "");
                v.setAttribute("muted", "");
                return v;
            },

            createGfycat: function(href)
            {
                var video_id;
                if ((m = /https?\:\/\/(\w+\.)?gfycat.com\/(\w+)(\.gif)?$/.exec(href)) != null)
                    video_id = m[2];

                // have to make a request to find out if the webm/mp4 is zippy/fat/giant
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "//gfycat.com/cajax/get/" + video_id, false);
                xhr.send();

                var info = JSON.parse(xhr.responseText).gfyItem;

                // use webm or mp4, whichever is smaller
                var video_src = info.mp4Url;
                if (info.mp4Size > info.webmSize)
                    video_src = info.webmUrl;

                var v = document.createElement("video");
                v.className = "imageloader";
                v.setAttribute("src", video_src);
                v.setAttribute("autoplay", "");
                v.setAttribute("loop", "");
                v.setAttribute("muted", "");
                v.setAttribute("width", info.width);
                v.setAttribute("height", info.height);
                return v;
            },

            createGiphy: function(href)
            {
                var video_id;
                if ((m = /https?\:\/\/giphy\.com\/gifs\/(\w+)$/.exec(href)) != null)
                    video_id = m[1];

                var video_src = "//media.giphy.com/media/" + video_id + "/giphy.mp4";

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
