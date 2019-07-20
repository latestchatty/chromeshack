(async() => {
    if (await settingsContain("hide_tagging_buttons")) {
        document.body.className += " hide_tagging_buttons";
    }

    if (await settingsContain("hide_tag_counts")) {
        document.body.className += " hide_tag_counts";
    }

    if (!(await settingsContain("shrink_user_icons"))) {
        document.body.className += " do_not_shrink_user_icons";
    }

    if (!(await settingsContain("reduced_color_user_icons"))) {
        document.body.className += " do_not_reduce_color_user_icons";
    }
})();
