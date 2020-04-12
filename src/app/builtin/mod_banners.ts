import * as browser from "webextension-polyfill";

import { processPostEvent } from "../core/events";

const ModBanners = {
    isEnabled: false,

    install() {
        const rootContainer = document.getElementById("chatty_comments_wrap");
        if (rootContainer && !rootContainer.classList.contains("show_banners"))
            rootContainer.setAttribute("class", "show_banners");
        ModBanners.isEnabled = rootContainer && rootContainer.classList.contains("show_banners");
        processPostEvent.addHandler(ModBanners.processPost);
    },

    processPost(elem) {
        if (ModBanners.isEnabled) {
            const _isOfftopic = elem.querySelector("li > div.fullpost.fpmod_offtopic:not(.getPost)");
            const _isStupid = elem.querySelector("li > div.fullpost.fpmod_stupid:not(.getPost)");
            const _isPolitical = elem.querySelector("li > div.fullpost.fpmod_political:not(.getPost)");
            const _isInformative = elem.querySelector("li > div.fullpost.fpmod_informative:not(.getPost)");
            if (_isOfftopic) {
                const _url = `url("${browser.runtime.getURL("images/banners/offtopic.png")}")`;
                _isOfftopic.style.backgroundImage = _url;
            } else if (_isStupid) {
                const _url = `url("${browser.runtime.getURL("images/banners/stupid.png")}")`;
                _isStupid.style.backgroundImage = _url;
            } else if (_isPolitical) {
                const _url = `url("${browser.runtime.getURL("images/banners/political.png")}")`;
                _isPolitical.style.backgroundImage = _url;
            } else if (_isInformative) {
                const _url = `url("${browser.runtime.getURL("images/banners/interesting.png")}")`;
                _isInformative.style.backgroundImage = _url;
            }
        }
    },
};

export default ModBanners;
