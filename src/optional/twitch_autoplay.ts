import { domMeasure, domMutate } from "../core/common";
import { enabledContains } from "../core/settings";

/// optionally disable auto-play on the Chatty's article Twitch player
export const TwitchAutoplay = {
    async install() {
        const is_enabled = await enabledContains(["twitchauto"]);
        if (is_enabled) {
            const articlePlayer = document.querySelector(".article-content iframe");
            let src = await domMeasure(() => articlePlayer?.getAttribute("src"));
            if (src?.indexOf("autoplay") === -1) src += "&autoplay=false";
            await domMutate(() => articlePlayer?.setAttribute("src", src));
        }
    },
};
