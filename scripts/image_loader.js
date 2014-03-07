settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("image_loader"))
    {
        ImageLoader =
        {
            install: function() {
                var s = document.createElement("script");
                s.setAttribute("src", "http://assets.gfycat.com/js/gfyajax-0.517d.js");
                s.setAttribute("type", "text/javascript");
                document.head.appendChild(s);
            },

            loadImages: function(item, id)
            {
                var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postbody.getElementsByTagName("a");

                for (var i = 0; i < links.length; i++)
                {
                    if (ImageLoader.isImage(links[i].href))
                    {
                        links[i].addEventListener("click", ImageLoader.toggleImage);
                    }
                }
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
                else if (ImageLoader.isGfycat(href))
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

                // change fuking image page into image
                if (/http\:\/\/(www\.)?fukung\.net\/v\//.test(href))
                    return href.replace(/(www\.)?fukung\.net\/v\//, 'media.fukung.net/images/');

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
                    return href + "?dl=1";

                // not a special case, just use the link's href
                return href;
            },

            toggleImage: function(e)
            {
                // left click only
                if (e.button == 0)
                {
                    var link = this;
                    if (link.childNodes[0].nodeName == "DIV")
                    {
                        if (e.target.className == "gfyVid") {
                            // already showing image, collapse it
                            link.innerHTML = link.href;
                        }
                        else {
                            // probably clicked the controls, let it through
                        }
                    }
                    else if (link.childNodes[0].nodeName == "IMG")
                    {
                        // already showing image, collapse it
                        link.innerHTML = link.href;
                    }
                    else
                    {
                        // image not showing, show it
                        var image = document.createElement("img");
                        var isgfy = ImageLoader.isGfycat(link.href);
                        if (isgfy)
                        {
                            image.className = "gfyitem";
                            image.setAttribute("data-id", ImageLoader.getGfycatId(link.href));
                            image.setAttribute("data-perimeter", "true");
                            image.setAttribute("data-dot", "false");
                        }
                        else
                        {
                            image.src = ImageLoader.getImageUrl(link.href);
                            image.className = "imageloader";
                        }
                        link.removeChild(link.firstChild);
                        link.appendChild(image);

                        if (isgfy) {
                            var s = document.createElement("script");
                            s.innerHTML = "gfyCollection.init()";
                            document.head.appendChild(s);
                        }

                    }
                    e.preventDefault();
                }
            },

            isGfycat: function(href)
            {
                // some urls don't end in jpeg/png/etc so the normal test won't work
                if (/http\:\/\/gfycat\.com\/\w+$/.test(href))
                {
                    return true;
                }

                return false;
            },

            getGfycatId: function(href)
            {
                if ((m = /http\:\/\/gfycat.com\/(\w+)$/.exec(href)) != null)
                    return m[1].toLowerCase();

                return false;
            }
        }

        processPostEvent.addHandler(ImageLoader.loadImages);
        ImageLoader.install();
    }
});
