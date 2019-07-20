let ModBanners = {
    isEnabled: false,

    install() {
        let rootContainer = document.getElementById("chatty_comments_wrap");
        if (rootContainer && !rootContainer.classList.contains("show_banners"))
            rootContainer.setAttribute("class", "show_banners");
        ModBanners.isEnabled = rootContainer && rootContainer.classList.contains("show_banners");
    },

    processPost(elem) {
        // avoid applying banners if not enabled
        if (ModBanners.isEnabled) {
            // cross-browser support for ChromeShack post banners via style injection
            let _isOfftopic = elem.getElementsByClassName("fpmod_offtopic").length > 0;
            let _isStupid = elem.getElementsByClassName("fpmod_stupid").length > 0;
            let _isPolitical = elem.getElementsByClassName("fpmod_political").length > 0;
            let _isInformative = elem.getElementsByClassName("fpmod_informative").length > 0;
            let _url;

            // rely on polyfills for relative extension paths
            if (_isOfftopic) {
                _url = `url("${browser.runtime.getURL("images/banners/offtopic.png")}")`;
                elem.getElementsByClassName("fpmod_offtopic")[0].style.backgroundImage = _url;
            } else if (_isPolitical) {
                _url = `url("${browser.runtime.getURL("images/banners/political.png")}")`;
                elem.getElementsByClassName("fpmod_political")[0].style.backgroundImage = _url;
            } else if (_isStupid) {
                _url = `url("${browser.runtime.getURL("images/banners/stupid.png")}")`;
                elem.getElementsByClassName("fpmod_stupid")[0].style.backgroundImage = _url;
            } else if (_isInformative) {
                _url = `url("${browser.runtime.getURL("images/banners/interesting.png")}")`;
                elem.getElementsByClassName("fpmod_informative")[0].style.backgroundImage = _url;
            }
        }
    }
};

ModBanners.install();
processPostEvent.addHandler(ModBanners.processPost);
