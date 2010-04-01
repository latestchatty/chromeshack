settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("category_banners"))
    {
        CategoryBanners =
        {
            install: function()
            {
                var banners = getSetting("category_banners_visible");

                var css = "";

                if (banners.contains("offtopic"))
                    css += " show_banner_offtopic";
                if (banners.contains("political"))
                    css += " show_banner_political";
                if (banners.contains("stupid"))
                    css += " show_banner_stupid";

                if (css.length > 0)
                {
                    document.body.className += css;
                }
            },

        }

        CategoryBanners.install();
    }
});
