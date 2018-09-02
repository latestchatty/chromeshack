settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("category_banners")) {
        document.body.className += " show_banners";
    }
});
