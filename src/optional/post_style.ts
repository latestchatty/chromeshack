import { domMutate } from "../core/common/dom";
import { enabledContains } from "../core/settings";

export const PostStyling = {
    async install() {
        const alterations: string[] = [];
        if (await enabledContains(["hide_tagging_buttons"])) alterations.push("hide_tagging_buttons");

        if (await enabledContains(["hide_tag_counts"])) alterations.push("hide_tag_counts");

        if (await enabledContains(["hide_gamification_notices"])) alterations.push("hide_gamification_notices");

        if (!(await enabledContains(["shrink_user_icons"]))) alterations.push("do_not_shrink_user_icons");
        if (!(await enabledContains(["reduced_color_user_icons"]))) alterations.push("do_not_reduce_color_user_icons");

        return await domMutate(() => {
            document.body.className = `${document.body.className} ${alterations.join(" ")}`;
        });
    },
};
