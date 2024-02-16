import { processPostEvent } from "../core/events";
import { getEnabledBuiltin } from "../core/settings";

export const ModBanners = {
  isEnabled: false,

  async install() {
    const isEnabled = await getEnabledBuiltin("mod_banners");
    if (!isEnabled) return;

    const rootContainer = document.getElementById("chatty_comments_wrap");
    if (!rootContainer?.classList?.contains("show_banners")) rootContainer?.setAttribute("class", "show_banners");
    ModBanners.isEnabled = rootContainer?.classList?.contains("show_banners");
    processPostEvent.addHandler(ModBanners.processPost);
  },

  processPost(args: PostEventArgs) {
    const { post } = args || {};
    if (ModBanners.isEnabled && post) {
      const _isOfftopic = post.querySelector("li > div.fullpost.fpmod_offtopic:not(.getPost)") as HTMLElement;
      const _isStupid = post.querySelector("li > div.fullpost.fpmod_stupid:not(.getPost)") as HTMLElement;
      const _isPolitical = post.querySelector("li > div.fullpost.fpmod_political:not(.getPost)") as HTMLElement;
      const _isInformative = post.querySelector("li > div.fullpost.fpmod_informative:not(.getPost)") as HTMLElement;
      if (_isOfftopic) {
        const _url = `url("${chrome.runtime.getURL("images/offtopic.png")}")`;
        _isOfftopic.style.backgroundImage = _url;
      } else if (_isStupid) {
        const _url = `url("${chrome.runtime.getURL("images/stupid.png")}")`;
        _isStupid.style.backgroundImage = _url;
      } else if (_isPolitical) {
        const _url = `url("${chrome.runtime.getURL("images/political.png")}")`;
        _isPolitical.style.backgroundImage = _url;
      } else if (_isInformative) {
        const _url = `url("${chrome.runtime.getURL("images/interesting.png")}")`;
        _isInformative.style.backgroundImage = _url;
      }
    }
  },
};
