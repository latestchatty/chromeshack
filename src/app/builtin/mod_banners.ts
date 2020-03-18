import * as browser from "webextension-polyfill";
import { processPostEvent } from "../core/events";

const ModBanners = {
    isEnabled: false,

    install() {
        let rootContainer = document.getElementById("chatty_comments_wrap");
        if (rootContainer && !rootContainer.classList.contains("show_banners"))
            rootContainer.setAttribute("class", "show_banners");
        ModBanners.isEnabled = rootContainer && rootContainer.classList.contains("show_banners");
        processPostEvent.addHandler(ModBanners.processPost);
    },

    processPost(elem) {
        if (ModBanners.isEnabled) {
            let _isOfftopic = elem.querySelector("li > div.fullpost.fpmod_offtopic:not(.getPost)");
            let _isStupid = elem.querySelector("li > div.fullpost.fpmod_stupid:not(.getPost)");
            let _isPolitical = elem.querySelector("li > div.fullpost.fpmod_political:not(.getPost)");
            let _isInformative = elem.querySelector("li > div.fullpost.fpmod_informative:not(.getPost)");
            if (_isOfftopic) {
                let _url = `url("${browser.runtime.getURL("images/banners/offtopic.png")}")`;
                _isOfftopic.style.backgroundImage = _url;
            } else if (_isStupid) {
                let _url = `url("${browser.runtime.getURL("images/banners/stupid.png")}")`;
                _isStupid.style.backgroundImage = _url;
            } else if (_isPolitical) {
                let _url = `url("${browser.runtime.getURL("images/banners/political.png")}")`;
                _isPolitical.style.backgroundImage = _url;
            } else if (_isInformative) {
                let _url = `url("${browser.runtime.getURL("images/banners/interesting.png")}")`;
                _isInformative.style.backgroundImage = _url;
            }
        }
    },
};

export default ModBanners;
