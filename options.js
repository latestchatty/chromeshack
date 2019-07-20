const loadOptions = async () => {
    showPostPreviewLocation(await getOption("post_preview_location"));
    showHighlightUsers(await getOption("highlight_users"));
    showVideoLoaderHD(await getOption("video_loader_hd"));
    showImageLoaderNewTab(await getOption("image_loader_newtab"));
    showNwsIncognito(await getOption("nws_incognito"));
    showSwitchers(await getOption("switchers"));
    showNotifications(await getOption("notifications"));
    showUserFilters(await getOption("user_filters"));
    showEmbedSocials(await getOption("embed_socials"));
    showEnabledScripts();
    trackChanges();
};

const getOption = async key => {
    let option = await getSetting(key);
    return option;
};

const saveOption = (key, value) => {
    setSetting(key, value);
};

const clearSettings = (e) => {
    resetSettings();
    loadOptions();
    saveOptions(e);
};

const showEmbedSocials = enabled => {
    let embeds = document.getElementById("embed_socials");
    if (enabled) embeds.checked = enabled;
    return embeds.checked;
};

const showImageLoaderNewTab = enabled => {
    let newtab = document.getElementById("image_loader_newtab");
    newtab.checked = enabled;
};

const getImageLoaderNewTab = () => {
    let newtab = document.getElementById("image_loader_newtab");
    return newtab.checked;
};

const showVideoLoaderHD = enabled => {
    let hd = document.getElementById("video_loader_hd");
    hd.checked = enabled;
};

const getVideoLoaderHD = () => {
    let hd = document.getElementById("video_loader_hd");
    return hd.checked;
};

const getNwsIncognito = () => {
    return document.getElementById("nws_incognito").checked;
};

const showNwsIncognito = enabled => {
    document.getElementById("nws_incognito").checked = enabled;
};

const getSwitchers = () => {
    return document.getElementById("switchers").checked;
};

const showSwitchers = enabled => {
    document.getElementById("switchers").checked = enabled;
};

const getNotifications = () => {
    return document.getElementById("enable_notifications").checked;
};

const showNotifications = enabled => {
    document.getElementById("enable_notifications").checked = enabled;
};

const showHighlightUsers = groups => {
    let highlightGroups = document.getElementById("highlight_groups");
    removeChildren(highlightGroups);

    for (let i = 0; i < groups.length; i++) {
        let group = groups[i];
        addHighlightGroup(null, group);
    }
};

const addHighlightGroup = (event, group) => {
    if (event) event.preventDefault();

    if (!group) group = { name: "", checked: true, css: "", users: [] };

    let settings = document.getElementById("highlight_groups");
    let div = document.createElement("div");
    div.className = "group";
    let check = document.createElement("input");
    check.type = "checkbox";
    check.className = "group_enabled";
    check.checked = group.enabled;
    div.appendChild(check);

    let name_box = document.createElement("input");
    name_box.type = "text";
    name_box.className = "group_name";
    name_box.value = group.name;
    div.appendChild(name_box);

    if (group.built_in) {
        name_box.className += " built_in";
        name_box.readOnly = true;
    } else {
        let users = document.createElement("input");
        users.className = "group_users";
        users.value = JSON.stringify(group.users);
        div.appendChild(users);

        let remove = document.createElement("a");
        remove.href = "#";
        remove.addEventListener("click", event => {
            event.preventDefault();
            settings.removeChild(div);
        });
        remove.appendChild(document.createTextNode("(remove)"));
        div.appendChild(remove);
    }

    div.appendChild(document.createElement("br"));

    let css = document.createElement("textarea");
    css.className = "group_css";
    css.rows = "2";
    css.cols = "25";
    css.value = group.css;
    div.appendChild(css);

    settings.appendChild(div);

    trackChanges();
};

const getHighlightGroups = () => {
    let groups = [];

    let settings = document.getElementById("highlight_groups");
    let group_divs = settings.getElementsByTagName("div");
    for (let i = 0; i < group_divs.length; i++) {
        let group = {};
        let input_name = getDescendentByTagAndClassName(group_divs[i], "input", "group_name");
        group.name = input_name.value;
        group.built_in = input_name.readOnly;
        group.enabled = getDescendentByTagAndClassName(group_divs[i], "input", "group_enabled").checked;
        group.css = getDescendentByTagAndClassName(group_divs[i], "textarea", "group_css").value;
        if (!group.built_in) {
            group.users = JSON.parse(getDescendentByTagAndClassName(group_divs[i], "input", "group_users").value);
        }
        groups.push(group);
    }

    return groups;
};

const showPostPreviewLocation = position => {
    let left = document.getElementById("post_preview_left");
    let right = document.getElementById("post_preview_right");
    left.checked = position == "Left";
    right.checked = position == "Right";
};

const getPostPreviewLocation = () => {
    let left = document.getElementById("post_preview_left");
    if (left.checked) return "Left";
    return "Right";
};

const showPostPreviewLive = enabled => {
    let live = document.getElementById("post_preview_live");
    live.checked = enabled;
};

const showEnabledScripts = async () => {
    let enabled = await getOption("enabled_scripts");

    let inputs = document.getElementsByTagName("input");

    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check") {
            inputs[i].onclick = toggleSettingsVisible;
            let found = false;
            for (let j = 0; j < enabled.length; j++) {
                if (enabled[j] == inputs[i].id) {
                    found = true;
                    break;
                }
            }

            inputs[i].checked = found;
            let settings_div = document.getElementById(inputs[i].id + "_settings");
            if (settings_div) {
                settings_div.style.display = found ? "block" : "none";
            }
        }
    }
};

const getEnabledScripts = () => {
    let enabled = [];
    let inputs = document.getElementsByTagName("input");

    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check") {
            if (inputs[i].checked) {
                enabled.push(inputs[i].id);
            }
        }
    }

    return enabled;
};

const toggleSettingsVisible = () => {
    let settings_div = document.getElementById(this.id + "_settings");
    if (settings_div) {
        settings_div.style.display = this.checked ? "block" : "none";
    }
};

const logInForNotifications = notificationuid => {
    let _dataBody = encodeURI(`id=${notificationuid}&name=Chrome Shack (${new Date()})`);
    postXHR({
        url: "https://winchatty.com/v2/notifications/registerNotifierClient",
        header: { "Content-type": "application/x-www-form-urlencoded" },
        data: _dataBody
    })
        .then(() => {
            //console.log("Response from register client " + res.responseText);
            browser.tabs.query({ url: "https://winchatty.com/v2/notifications/ui/login*" }).then(tabs => {
                if (tabs.length === 0) {
                    browser.tabs.create({
                        url: `https://winchatty.com/v2/notifications/ui/login?clientId=${notificationuid}`
                    });
                } else {
                    //Since they requested, we'll open the tab and make sure they're at the correct url.
                    browser.tabs.update(tabs[0].tabId, {
                        active: true,
                        highlighted: true,
                        url: `https://winchatty.com/v2/notifications/ui/login?clientId=${notificationuid}`
                    });
                }
            });
        })
        .catch(err => {
            console.log(err);
        });
};

const updateNotificationOptions = async () => {
    //Log the user in for notifications.
    if (getNotifications()) {
        let uid = await getOption("notificationuid");
        if (!uid) {
            fetchSafe("https://winchatty.com/v2/notifications/generateId").then(json => {
                // sanitized in common.js!
                let notificationUID = json.id;
                //console.log("Got notification id of " + notificationUID);
                saveOption("notificationuid", notificationUID);
                logInForNotifications(notificationUID);
            });
        } else {
            //console.log("Notifications already set up using an id of " + notificationUID);
        }
    } else {
        saveOption("notificationuid", "");
        //TODO: Log them out because they're disabling it. This requires a username and password.  For now we'll just kill the UID and they can remove it manually because... meh whatever.
    }
};

const showUserFilters = userFilters => {
    let usersLst = document.getElementById("filtered_users");
    for (let i = 0; i < usersLst.length; i++) {
        usersLst.remove(0);
    }
    if (userFilters) {
        for (let i = 0; i < userFilters.length; i++) {
            let newOption = document.createElement("option");
            newOption.textContent = userFilters[i];
            newOption.value = userFilters[i];
            usersLst.appendChild(newOption);
        }
    }
};

const getUserFilters = () => {
    let usersLst = document.getElementById("filtered_users");
    let users = [];
    let options = usersLst.getElementsByTagName("option");
    for (let i = 0; i < options.length; i++) {
        users.push(options[i].value);
    }
    return users;
};

const addUserFilter = event => {
    event.preventDefault();
    let usernameTxt = document.getElementById("new_user_filter_text");
    let usersLst = document.getElementById("filtered_users");
    let username = superTrim(usernameTxt.value).toLowerCase();
    if (username == "") {
        alert("Please enter a username to filter.");
        return;
    }
    let list = usersLst.getElementsByTagName("option");
    for (let i = 0; i < list.length; i++) {
        let existingUsername = list[i].value;
        if (username == existingUsername) {
            alert("That username is already filtered.");
            usernameTxt.value = "";
            return;
        }
    }
    let newOption = document.createElement("option");
    newOption.textContent = username;
    newOption.value = username;
    usersLst.appendChild(newOption);
    usernameTxt.value = "";
    saveOptions();
};

const removeUserFilter = event => {
    event.preventDefault();
    let usersLst = document.getElementById("filtered_users");
    let index = usersLst.selectedIndex;
    if (index >= 0) {
        usersLst.remove(index);
        saveOptions();
    } else {
        alert("Please select a username to remove.");
    }
};

const saveOptions = (e) => {
    // Update status to let the user know options were saved
    let status = document.getElementById("status");

    try {
        saveOption("post_preview_location", getPostPreviewLocation());
        saveOption("enabled_scripts", getEnabledScripts());
        saveOption("highlight_users", getHighlightGroups());
        saveOption("video_loader_hd", getVideoLoaderHD());
        saveOption("image_loader_newtab", getImageLoaderNewTab());
        saveOption("nws_incognito", getNwsIncognito());
        saveOption("switchers", getSwitchers());
        updateNotificationOptions();
        saveOption("notifications", getNotifications());
        saveOption("user_filters", getUserFilters());
        saveOption("embed_socials", showEmbedSocials());
    } catch (err) {
        //alert("There was an error while saving your settings:\n" + err);
        status.textContent = `Error: ${err}`;
        return;
    }

    if (e.target.id === "clear_settings")
        status.innerText = "Options Reset";
    else
        status.innerText = "Options Saved";

    status.classList.remove("hidden");
    setTimeout(() => status.classList.add("hidden"), 3000);
};

document.addEventListener("DOMContentLoaded", () => {
    loadOptions();
    document.getElementById("clear_settings").addEventListener("click", clearSettings);
    document.getElementById("add_highlight_group").addEventListener("click", addHighlightGroup);
    document.getElementById("add_user_filter_btn").addEventListener("click", addUserFilter);
    document.getElementById("remove_user_filter_btn").addEventListener("click", removeUserFilter);
});

const trackChanges = () => {
    let links = document.getElementById("content").getElementsByTagName("a");
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", saveOptions);
    }

    let inputs = document.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("change", saveOptions);
    }

    let selects = document.getElementsByTagName("select");
    for (let i = 0; i < selects.length; i++) {
        selects[i].addEventListener("change", saveOptions);
    }

    let textareas = document.getElementsByTagName("textarea");
    for (let i = 0; i < textareas.length; i++) {
        textareas[i].addEventListener("input", saveOptions);
    }
};
