settingsLoadedEvent.addHandler(() => {
    if (getSetting("enabled_scripts").contains("hide_tagging_buttons")) {
        document.body.className += " hide_tagging_buttons";
    }

    if (getSetting("enabled_scripts").contains("hide_tag_counts")) {
        document.body.className += " hide_tag_counts";
    }

    if (!getSetting("enabled_scripts").contains("shrink_user_icons")) {
        document.body.className += " do_not_shrink_user_icons";
    }

    if (!getSetting("enabled_scripts").contains("reduced_color_user_icons")) {
        document.body.className += " do_not_reduce_color_user_icons";
    }
});
