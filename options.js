/*
 * Highlight Users' Support
 */

// https://stackoverflow.com/a/5365036
const getRandomColor = () => `#${((Math.random() * 0xffffff) << 0).toString(16)}`;

const getRandomInt = () => {
    let min = Math.ceil(1);
    let max = Math.floor(999999);
    return Math.floor(Math.random() * (max - min)) + min;
};

const trimName = (name) => name.trim().replace(/[\W\s]+/g, "").toLowerCase();

const showHighlightGroups = async () => {
    let highlightGroups = document.getElementById("highlight_groups");
    removeChildren(highlightGroups);
    let groups = await getSetting("highlight_groups");
    for (let group of groups || [])
        addHighlightGroup(null, group);
};

const getHighlightGroups = async () => {
    // serialize all existing highlight groups
    let activeGroups = [...document.querySelectorAll("#highlight_group")];
    let highlightRecords = [];
    for (let group of activeGroups || []) {
        let record = getHighlightGroup(group);
        if (!isEmpty(record)) highlightRecords.push(record);
    }
    if (highlightRecords.length > 0)
        return await setSetting("highlight_groups", highlightRecords);
};

const getHighlightGroup = (groupElem) => {
    // serialize a highlight group
    if (groupElem) {
        let enabled = groupElem.querySelector(".group_header input[type='checkbox']").checked;
        let name = groupElem.querySelector(".group_label").value;
        let built_in = groupElem.querySelector(".group_label").hasAttribute("readonly");
        let css = groupElem.querySelector(".group_css textarea").value;
        let users = [...groupElem.querySelector(".group_select select").options].map(x => x.text);
        return {name, enabled, built_in, css, users};
    }
    return {};
};

const newHighlightGroup = (name, css, username) => {
    // return a new group with a random color as its default css
    return {
        enabled: true,
        name: name && name.length > 0 ? name : `New Group ${getRandomInt()}`,
        css: css && css.length > 0 ? css : `color: ${getRandomColor()} !important;`,
        users: username && username.length > 0 ? [username] : []
    };
};

let debouncedUpdate = null;
const delayedTextUpdate = (e) => {
    if (debouncedUpdate) clearTimeout(debouncedUpdate);
    debouncedUpdate = setTimeout(async () => {
        let groupElem = e.target.closest("#highlight_group");
        let realGroupName = groupElem.querySelector(".group_label").dataset.name;
        let updatedGroup = getHighlightGroup(groupElem);
        await setHighlightGroup(realGroupName, updatedGroup);
    }, 500);
};

const addHighlightGroup = (e, group) => {
    if (e) e.preventDefault();
    if (!group) group = newHighlightGroup();
    let groupElem = document.createElement("div");
    let trimmedName = trimName(group.name);
    groupElem.id = "highlight_group";
    groupElem.innerHTML = `
        <div class="group_header">
            <input type="checkbox" ${group.enabled && "checked"} />
            <input
                type="text"
                class="group_label"
                data-name="${group.name}"
                value="${group.name}"
                ${group.built_in && "readonly"}
            ></input>
            <button id="remove_group">Remove</button>
        </div>
        <div class="group_select">
            <select id="${trimmedName}_list" multiple></select>
        </div>
        <div class="group_option_input">
            <input type="text" class="group_option_textinput"></input>
            <button id="option_add">Add</button>
            <button id="option_del" disabled>Remove</button>
        </div>
        <div class="group_css">
            <textarea id="${trimmedName}_css"/>${group.css}</textarea>
        </div>
    `;
    if (group.built_in) {
        // hide mutation interactions if userlist is readonly
        groupElem.querySelector("#remove_group").setAttribute("style", "display: none;");
        groupElem.querySelector(".group_select").setAttribute("style", "display: none;");
        groupElem.querySelector(".group_option_input").setAttribute("style", "display: none;");
    }
    for (let user of group.users || []) {
        let select = groupElem.querySelector(`#${trimmedName}_list`);
        let option = document.createElement("option");
        option.setAttribute("value", user);
        option.innerText = user;
        select.appendChild(option);
    }
    // handle Add, Remove, Remove Group, Toggle, and Text Changed states
    groupElem.querySelector("#option_add").addEventListener("click", async (e) => {
        let optionContainer = e.target.parentNode.parentNode.querySelector(".group_select > select");
        let username = e.target.parentNode.querySelector(".group_option_textinput");
        let groupName = e.target.parentNode.parentNode.querySelector(".group_label").value;
        let groupHas = await highlightGroupContains(groupName, username.value);
        if (groupHas) {
            alert("Highlight groups cannot contain duplicates!");
            username.value = "";
            return;
        }
        await addHighlightUser(groupName, username.value);
        let option = document.createElement("option");
        option.setAttribute("value", username.value);
        option.innerText = username.value;
        username.value = "";
        optionContainer.appendChild(option);
    });
    groupElem.querySelector("#option_del").addEventListener("click", async (e) => {
        let groupElem = e.target.closest("#highlight_group");
        let groupName = groupElem.querySelector(".group_label").value;
        let usersSelect = groupElem.querySelector("select");
        for (let option of [...usersSelect.selectedOptions])
            option.parentNode.removeChild(option);

        let updatedGroup = getHighlightGroup(groupElem);
        await setHighlightGroup(groupName, updatedGroup);
    });
    groupElem.querySelector("#remove_group").addEventListener("click", (e) => {
        let groupElem = e.target.closest("#highlight_group");
        let groupsContainer = e.target.closest("#highlight_groups");
        groupsContainer.removeChild(groupElem);
        getHighlightGroups();
    });
    groupElem.querySelector("input[type='checkbox']").addEventListener("click", async (e) => {
        let groupElem = e.target.closest("#highlight_group");
        let groupName = groupElem.querySelector(".group_label").value;
        let updatedGroup = getHighlightGroup(groupElem);
        await setHighlightGroup(groupName, updatedGroup);
    });
    groupElem.querySelector("select").addEventListener("change", (e) => {
        let groupElem = e.target.closest("#highlight_group");
        let selected = e.target.options.selectedIndex;
        let removeBtn = groupElem.querySelector("#option_del");
        if (selected > -1) removeBtn.removeAttribute("disabled");
        else if (selected === -1) removeBtn.setAttribute("disabled", "");
    });
    // handle changes on mutable text fields with a debounce
    let textfields = [...groupElem.querySelectorAll(".group_css textarea, .group_label")];
    for (let textfield of textfields || []) {
        if (!textfield.hasAttribute("readonly")) {
            textfield.removeEventListener("keyup", delayedTextUpdate);
            textfield.addEventListener("keyup", delayedTextUpdate);
        }
    }
    document.querySelector("#highlight_groups").appendChild(groupElem);
    if (e && e.target.matches("#add_highlight_group")) getHighlightGroups();
};


/*
 * Notifications Support
 */

const logInForNotifications = (notificationuid) => {
    return postXHR({
        url: "https://winchatty.com/v2/notifications/registerNotifierClient",
        header: {"Content-type": "application/x-www-form-urlencoded"},
        data: encodeURI(`id=${notificationuid}&name=Chrome Shack (${new Date()})`)
    })
        .then(() => {
            //console.log("Response from register client " + res.responseText);
            browser.tabs.query({url: "https://winchatty.com/v2/notifications/ui/login*"}).then((tabs) => {
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
        .catch((err) => {
            console.log(err);
        });
};

const updateNotificationOptions = async () => {
    //Log the user in for notifications.
    let notifications = await getEnabled("enable_notifications");
    if (notifications) {
        let uid = await getSetting("notificationuid");
        if (!uid) {
            let json = await fetchSafe("https://winchatty.com/v2/notifications/generateId");
            let notificationUID = json.id;
            if (notificationUID) {
                await setSetting("notificationuid", notificationUID);
                logInForNotifications(notificationUID);
            }
        } else {
            //console.log("Notifications already set up using an id of " + notificationUID);
        }
    } else {
        await setSetting("notificationuid", "");
        //TODO: Log them out because they're disabling it. This requires a username and password.  For now we'll just kill the UID and they can remove it manually because... meh whatever.
    }
};


/*
 * Custom User Filters Support
 */
const showUserFilters = async () => {
    let filters = await getSetting("user_filters");
    let usersLst = document.getElementById("filtered_users");
    removeChildren(usersLst);

    for (let filter of filters || []) {
        let newOption = document.createElement("option");
        newOption.textContent = filter;
        newOption.value = filter;
        usersLst.appendChild(newOption);
    }

    let addFilterBtn = document.getElementById("add_user_filter_btn");
    addFilterBtn.removeEventListener("click", addUserFilter);
    addFilterBtn.addEventListener("click", addUserFilter);
    let delFilterBtn = document.getElementById("remove_user_filter_btn");
    delFilterBtn.removeEventListener("click", removeUserFilter);
    delFilterBtn.addEventListener("click", removeUserFilter);
    usersLst.removeEventListener("change", filterOptionsChanged);
    usersLst.addEventListener("change", filterOptionsChanged);
};

const filterOptionsChanged = (e) => {
    let filterElem = e.target.closest("#custom_user_filters_settings");
    let selected = document.getElementById("filtered_users").options.selectedIndex;
    let removeBtn = filterElem.querySelector("#remove_user_filter_btn");
    if (selected > -1) removeBtn.removeAttribute("disabled");
    else if (selected === -1) removeBtn.setAttribute("disabled", "");
};

const getUserFilters = async () => {
    // serialize user filters to extension storage
    let usersLst = document.getElementById("filtered_users");
    let users = [...usersLst.options].map(x => x.text);
    return await setSetting("user_filters", users);
};

const addUserFilter = async (e) => {
    let username = document.getElementById("new_user_filter_text");
    let usersLst = document.getElementById("filtered_users");
    let users = [...usersLst.options].map(x => x.text);
    let filtersHas = await filtersContains(username.value);
    if (filtersHas) {
        alert("Filters cannot contain duplicates!");
        username.value = "";
        return;
    }
    let newOption = document.createElement("option");
    newOption.textContent = username.value;
    newOption.value = username.value;
    usersLst.appendChild(newOption);
    username.value = "";
    await getUserFilters();
};

const removeUserFilter = async (e) => {
    let selectElem = document.getElementById("filtered_users");
    let removeBtnElem = document.getElementById("remove_user_filter_btn");
    let selectedOptions = [...selectElem.selectedOptions];
    for (let option of selectedOptions || [])
        option.parentNode.removeChild(option);
    removeBtnElem.setAttribute("disabled", "");
    await getUserFilters();
};


/*
 * Options Serialization/Deserialization
 */
const getEnabledScripts = async () => {
    // serialize checkbox/option state to extension storage
    let enabled = [];
    let checkboxes = [...document.querySelectorAll("input[type='checkbox'].script_check")];
    for (let checkbox of checkboxes) {
        if (checkbox.checked) {
            // put non-boolean save supports here
            if (checkbox.id === "enable_notifications") await updateNotificationOptions();
            enabled.push(checkbox.id);
        }
    }
    await setSetting("enabled_scripts", enabled);
    return enabled;
};

const loadOptions = async () => {
    // deserialize extension storage to options state
    let scripts = await getEnabled();
    let checkboxes = [...document.querySelectorAll("input[type='checkbox'].script_check")];
    for (let script of scripts) {
        for (let checkbox of checkboxes) {
            if (checkbox.id === script) checkbox.checked = true;
            let settingsChild = document.querySelector(`div#${checkbox.id}_settings`);
            if (checkbox.checked && settingsChild)
                settingsChild.classList.remove("hidden");
            else if (!checkbox.checked && settingsChild)
                settingsChild.classList.add("hidden");
        }
        // put non-boolean load supports here
        if (script === "enable_notifications") await updateNotificationOptions();
        else if (script === "highlight_users") await showHighlightGroups();
        else if (script === "custom_user_filters") await showUserFilters();
    }
};

const saveOptions = async (e) => {
    let status = document.getElementById("status");
    if (e && e.target.id !== "clear_settings") {
        await getEnabledScripts();
        await loadOptions();
    }

    // Update status to let the user know options were saved
    if (e && e.target.id === "clear_settings") status.innerText = "Options Reset";
    else status.innerText = "Options Saved";
    status.classList.remove("hidden");
    const statusMsg = () => status.classList.add("hidden");
    clearTimeout(statusMsg);
    setTimeout(statusMsg, 2000);
};

const clearSettings = (e) => resetSettings().then(loadOptions).then(saveOptions(e));


/*
 * Options Event Handling Stuff
 */
const trackChanges = () => {
    let checkboxes = [...document.querySelectorAll("input[type='checkbox'].script_check")];
    for (let checkbox of checkboxes || []) {
        checkbox.removeEventListener("change", saveOptions);
        checkbox.addEventListener("change", saveOptions);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadOptions();
    trackChanges();
    document.getElementById("clear_settings").addEventListener("click", clearSettings);
    document.getElementById("add_highlight_group").addEventListener("click", addHighlightGroup);
});
