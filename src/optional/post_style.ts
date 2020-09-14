import { settingsContains } from "../core/settings";

export const PostStyling = {
    async install() {
        if (await settingsContains("hide_tagging_buttons")) document.body.className += " hide_tagging_buttons";

        if (await settingsContains("hide_tag_counts")) document.body.className += " hide_tag_counts";

        if (!(await settingsContains("shrink_user_icons"))) document.body.className += " do_not_shrink_user_icons";

        if (!(await settingsContains("reduced_color_user_icons"))) {
            document.body.className += " do_not_reduce_color_user_icons";
        }
    },
};
