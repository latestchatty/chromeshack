import { browser } from "webextension-polyfill-ts";
import type { PostEventArgs } from "../core";
import { processPostEvent } from "../core/events";
import { enabledContains } from "../core/settings";

//
// A note to reviewers:
//
// This script causes hyperlinks to "Not Safe For Work" imagery (e.g. pornographic images) to open automatically in
// an incognito window when clicked, instead of a normal tab. In Firefox, doing so requires the
// "allowedIncognitoAccess" permission.
//

export const NwsIncognito = {
    async install() {
        const is_enabled = await enabledContains(["nws_incognito"]);
        if (is_enabled) processPostEvent.addHandler(NwsIncognito.hookToNwsPosts);
    },

    hookToNwsPosts({ post }: PostEventArgs) {
        const nwsLinks = [...post?.querySelectorAll(".sel .fpmod_nws .postbody a, .op.fpmod_nws .postbody a")];
        for (const link of nwsLinks || []) {
            // avoid reapplying
            const _link = link as HTMLElement;
            if (_link?.textContent?.indexOf(" (Incognito)") > -1) return;

            //Clone the link to get rid of any handlers that were put on it before (like the inline image loader)
            //Of course, that relies on it being done before this.  So... yeah.
            const cloned = link?.cloneNode(false) as HTMLElement;
            cloned.addEventListener("click", (e) => {
                e?.preventDefault();
                // Note to reviewers: please refer to the top of this file for explanation
                browser.runtime.sendMessage({ name: "allowedIncognitoAccess" }).then((result: Promise<boolean>) => {
                    if (!window.chrome && !result)
                        alert(
                            'This feature will not work unless you enable "Run in Private Windows" in the Chrome Shack addon settings for Firefox!',
                        );

                    browser.runtime.sendMessage({
                        name: "launchIncognito",
                        value: (e?.target as HTMLAnchorElement).href,
                    });
                });
                return false;
            });

            // remove expando buttons for Incognito mode
            const expando = _link?.querySelector("div.expando");
            if (expando) _link?.removeChild(expando);
            cloned.textContent = `${_link?.textContent} (Incognito)`;

            link?.parentNode?.replaceChild(cloned, _link);
        }
    },
};
