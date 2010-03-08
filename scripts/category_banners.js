//if (getSetting("script_enabled").contains("category_banners"))
//{
    CategoryBanners =
    {
        install: function()
        {
            var banners = getSetting("category_banners_visible");

            var css = "";

            if (banners.contains("offtopic"))
                css += CategoryBanners.addBanner("fpmod_offtopic", "offtopic.png", "#7D7D7D") + "\n";
            if (banners.contains("political"))
                css += CategoryBanners.addBanner("fpmod_political", "political.png", "#F8A500") + "\n";
            if (banners.contains("stupid"))
                css += CategoryBanners.addBanner("fpmod_stupid", "stupid.png", "#379700") + "\n";

            if (css.length > 0)
                insertStyle(css);
        },

        addBanner: function(type, image, color)
        {
            return "div." + type + "{\n\
                background-image:url(" + chrome.extension.getURL('images/banners/' + image) + ");\n\
                background-position: right top;\n\
                background-repeat: no-repeat;\n\
                border-top: 1px solid " + color + " !important;\n\
                }";
        }
    }

    CategoryBanners.install();
//}
