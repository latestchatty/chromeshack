import { enabledContains } from "../core/settings";

/// optionally disable auto-play on the Chatty's article Twitch player
const TwitchAutoplay = {
    async install() {
        // loads on startup
        const is_enabled = await enabledContains("twitchauto");
        if (is_enabled) {
            const articlePlayer = document.querySelector(".article-content iframe");
            let src = articlePlayer?.getAttribute("src");
            if (src?.indexOf("autoplay") === -1) src += "&autoplay=false";
            articlePlayer?.setAttribute("src", src);
        }
    },
};
export default TwitchAutoplay;
