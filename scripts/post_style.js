settingsLoadedEvent.addHandler(() => {
    if (objContains("hide_tagging_buttons", getSetting("enabled_scripts"))) {
        document.body.className += " hide_tagging_buttons";
    }

    if (objContains("hide_tag_counts", getSetting("enabled_scripts"))) {
        document.body.className += " hide_tag_counts";
    }

    if (!objContains("shrink_user_icons", getSetting("enabled_scripts"))) {
        document.body.className += " do_not_shrink_user_icons";
    }

    if (!objContains("reduced_color_user_icons", getSetting("enabled_scripts"))) {
        document.body.className += " do_not_reduce_color_user_icons";
    }
});
