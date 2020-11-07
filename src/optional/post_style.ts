import { observerInstalledEvent } from "../core/events";
import { enabledContains } from "../core/settings";

export const PostStyling = {
    install() {
        observerInstalledEvent.addHandler(PostStyling.apply);
    },

    async apply() {
        if (await enabledContains(["hide_tagging_buttons"])) document.body.className += " hide_tagging_buttons";

        if (await enabledContains(["hide_tag_counts"])) document.body.className += " hide_tag_counts";

        if (!(await enabledContains(["shrink_user_icons"]))) document.body.className += " do_not_shrink_user_icons";

        if (!(await enabledContains(["reduced_color_user_icons"])))
            document.body.className += " do_not_reduce_color_user_icons";
    },
};
