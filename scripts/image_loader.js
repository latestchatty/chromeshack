if (getSetting("enabled_scripts").contains("image_loader"))
{
    ImageLoader =
    {
        loadImages: function(item, id)
        {
            var postbody = getDescendentByTagAndClassName(item, "div", "postbody");
            var links = postbody.getElementsByTagName("a");

            var imageRegex = /\/[^:?]+\.(jpg|jpeg|png|gif|bmp)$/i;

            for (var i = 0; i < links.length; i++)
            {
                var href = ImageLoader.getImageUrl(links[i].href);
                if (href.match(imageRegex))
                {
                    links[i].addEventListener("click", ImageLoader.toggleImage);
                }
            }
        },

        getImageUrl: function(href)
        {
            // change shackpics image page into image
            if (/shackpics\.com\/viewer\.x/.test(href))
                return href.replace(/viewer\.x\?file=/, 'files/');

            // change fuking image page into image
            if (/http\:\/\/(www\.)?fukung\.net\/v\//.test(href))
                return href.replace(/(www\.)?fukung\.net\/v\//, 'media.fukung.net/images/');

            // not a special case, just use the link's href
            return href;
        },

        toggleImage: function(e)
        {
            // left click only
            if (e.button == 0)
            {
                var link = this;
                if (link.childNodes[0].nodeName == "IMG")
                {
                    // already showing image, collapse it
                    link.innerHTML = link.href;
                }
                else
                {
                    // image not showing, show it
                    var image = document.createElement("img");
                    image.src = ImageLoader.getImageUrl(link.href);
                    link.removeChild(link.firstChild);
                    link.appendChild(image);
                }
                e.preventDefault();
            }
        }
    }

    processPostEvent.addHandler(ImageLoader.loadImages);
}
