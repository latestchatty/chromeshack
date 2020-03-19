import * as browser from "webextension-polyfill";

import * as common from "./core/common";
import * as settings from "./core/settings";

import "../styles/popup.css";

interface NotificationRegister {
    id?: number;
}

/*
 * Highlight Users' Support
 */

// https://stackoverflow.com/a/25873123
const randomHsl = () => `hsla(${getRandomNum(0, 360)}, ${getRandomNum(25, 100)}%, ${getRandomNum(35, 60)}%, 1)`;

const getRandomInt = (min, max) => Math.floor(Math.random() * (Math.ceil(max) - Math.floor(min))) + Math.ceil(min);

const getRandomNum = (min, max, precision?: number) =>
    parseFloat((Math.random() * (max - min) + min).toPrecision(precision ? precision : 1));

const trimName = (name) =>
    name
        .trim()
        .replace(/[\W\s]+/g, "")
        .toLowerCase();

const showHighlightGroups = async () => {
    let highlightGroups = document.getElementById("highlight_groups");
    common.removeChildren(highlightGroups);
    let groups = await settings.getSetting("highlight_groups");
    for (let group of groups || []) addHighlightGroup(null, group);
};

const getHighlightGroups = async () => {
    // serialize all existing highlight groups
    let activeGroups = [...document.querySelectorAll("#highlight_group")];
    let highlightRecords = [];
    for (let group of activeGroups || []) {
        let record = getHighlightGroup(group);
        if (!common.isEmpty(record)) highlightRecords.push(record);
    }
    if (highlightRecords.length > 0) return await settings.setSetting("highlight_groups", highlightRecords);
};

const getHighlightGroup = (groupElem?) => {
    // serialize a highlight group
    if (groupElem) {
        let enabled = groupElem.querySelector(".group_header input[type='checkbox']").checked;
        let name = groupElem.querySelector(".group_label").value;
        let built_in = groupElem.querySelector(".group_label").hasAttribute("readonly");
        let css = groupElem.querySelector(".group_css textarea").value;
        let users = [...groupElem.querySelector(".group_select select").options].map((x) => x.text);
        return { name, enabled, built_in, css, users };
    }
    return {};
};

const newHighlightGroup = (name?, css?, username?) => {
    // return a new group with a random color as its default css
    return {
        enabled: true,
        name: name && name.length > 0 ? name : `New Group ${getRandomInt(1, 999999)}`,
        css: css && css.length > 0 ? css : `color: ${randomHsl()} !important;`,
        users: username && username.length > 0 ? [username] : [],
    };
};

let debouncedUpdate = null;
const delayedTextUpdate = (e) => {
    if (debouncedUpdate) clearTimeout(debouncedUpdate);
    debouncedUpdate = setTimeout(async () => {
        let groupElem = e.target.closest("#highlight_group");
        let groupLabel = groupElem.querySelector(".group_label");
        let realGroupName = groupLabel.dataset.name;
        let updatedGroup = getHighlightGroup(groupElem);
        let updatedCSSField = groupElem.querySelector(".group_css textarea");
        let cssSplotch = groupElem.querySelector(".test_css span");
        if (updatedCSSField.value.length > 0) cssSplotch.setAttribute("style", common.superTrim(updatedCSSField.value));
        await settings.setHighlightGroup(realGroupName, updatedGroup);
        groupLabel.dataset.name = updatedGroup.name;
    }, 500);
};

const addHighlightGroup = (e: Event, group?) => {
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
            <div class="test_css">
                <span id="${trimmedName}_splotch" style="${group.css}" title="Click to try a new color">Aa</span>
            </div>
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
        const this_node = <HTMLElement>e.target;
        const this_input = this_node.parentNode.parentNode;
        let optionContainer = this_node.parentNode.parentNode.querySelector(".group_select > select");
        let username = this_node.parentNode.querySelector(".group_option_textinput");
        let groupName = (<HTMLInputElement>this_input.querySelector(".group_label")).value;
        let this_username = (<HTMLInputElement>username).value;
        let groupHas = await settings.highlightGroupContains(groupName, this_username);
        if (groupHas) {
            alert("Highlight groups cannot contain duplicates!");
            this_username = "";
            return;
        }
        await settings.addHighlightUser(groupName, this_username);
        let option = document.createElement("option");
        option.setAttribute("value", this_username);
        option.innerText = this_username;
        this_username = "";
        optionContainer.appendChild(option);
    });
    groupElem.querySelector("#option_del").addEventListener("click", async (e) => {
        let groupElem = (<HTMLElement>e.target).closest("#highlight_group");
        let groupName = (<HTMLInputElement>groupElem.querySelector(".group_label")).value;
        let usersSelect = groupElem.querySelector("select");
        for (let option of [...usersSelect.selectedOptions]) option.parentNode.removeChild(option);

        let updatedGroup = getHighlightGroup(groupElem);
        await settings.setHighlightGroup(groupName, updatedGroup);
    });
    groupElem.querySelector("#remove_group").addEventListener("click", (e) => {
        let groupElem = (<HTMLElement>e.target).closest("#highlight_group");
        let groupsContainer = (<HTMLElement>e.target).closest("#highlight_groups");
        groupsContainer.removeChild(groupElem);
        getHighlightGroups();
    });
    groupElem.querySelector("input[type='checkbox']").addEventListener("click", async (e) => {
        let groupElem = (<HTMLElement>e.target).closest("#highlight_group");
        let groupName = (<HTMLInputElement>groupElem.querySelector(".group_label")).value;
        let updatedGroup = getHighlightGroup(groupElem);
        await settings.setHighlightGroup(groupName, updatedGroup);
    });
    groupElem.querySelector("select").addEventListener("change", (e) => {
        let groupElem = (<HTMLElement>e.target).closest("#highlight_group");
        let selected = (<HTMLSelectElement>e.target).options.selectedIndex;
        let removeBtn = groupElem.querySelector("#option_del");
        if (selected > -1) removeBtn.removeAttribute("disabled");
        else if (selected === -1) removeBtn.setAttribute("disabled", "");
    });
    // let the user switch colors by clicking the preview splotch
    groupElem.querySelector(".test_css span").addEventListener("click", (e) => {
        let group = (<HTMLElement>e.target).closest("#highlight_group");
        let styleField = group.querySelector(".group_css textarea");
        let firstColor;
        let style = (<HTMLInputElement>styleField).value.replace(/((?:\s*?)color:.+?;)/gim, (m, g1) => {
            // allow only two color rules, the original and our test rule
            if (!firstColor) {
                firstColor = g1;
                return g1;
            } else return "";
        });
        (<HTMLInputElement>styleField).value = common.superTrim(`${style} color: ${randomHsl()} !important;`);
        delayedTextUpdate(e); // fire off a css field update
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
    if (e && (<HTMLElement>e.target).matches("#add_highlight_group")) getHighlightGroups();
};

/*
 * Custom User Filters Support
 */
const showUserFilters = async () => {
    let filters = await settings.getSetting("user_filters");
    let usersLst = document.getElementById("filtered_users");
    common.removeChildren(usersLst);

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
    let selected = (<HTMLSelectElement>document.getElementById("filtered_users")).options.selectedIndex;
    let removeBtn = filterElem.querySelector("#remove_user_filter_btn");
    if (selected > -1) removeBtn.removeAttribute("disabled");
    else if (selected === -1) removeBtn.setAttribute("disabled", "");
};

const getUserFilters = async () => {
    // serialize user filters to extension storage
    let usersLst = <HTMLSelectElement>document.getElementById("filtered_users");
    let users = [...usersLst.options].map((x) => x.text);
    let fullpostHider = <HTMLInputElement>document.getElementById("cuf_hide_fullposts");
    if (fullpostHider) await settings.setSetting(fullpostHider.id, fullpostHider.checked);
    return await settings.setSetting("user_filters", users);
};

const addUserFilter = async (e) => {
    let username = <HTMLInputElement>document.getElementById("new_user_filter_text");
    let usersLst = document.getElementById("filtered_users");
    let filtersHas = await settings.filtersContains(username.value);
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
    let selectElem = <HTMLSelectElement>document.getElementById("filtered_users");
    let removeBtnElem = document.getElementById("remove_user_filter_btn");
    let selectedOptions = [...selectElem.selectedOptions];
    for (let option of selectedOptions || []) option.parentNode.removeChild(option);
    removeBtnElem.setAttribute("disabled", "");
    await getUserFilters();
};

/*
 * Options Serialization/Deserialization
 */
const getEnabledScripts = async () => {
    // serialize checkbox/option state to extension storage
    let enabled = [];
    let enabledSuboptions = [];
    let checkboxes = [
        ...document.querySelectorAll(`
        input[type='checkbox'].script_check,
        input[type='checkbox'].suboption
    `),
    ];
    for (let checkbox of checkboxes) {
        const _checkbox = checkbox as HTMLInputElement;
        if (common.elementMatches(_checkbox, ".script_check") && _checkbox.checked) {
            // put non-boolean save supports here
            enabled.push(_checkbox.id);
        } else if (common.elementMatches(_checkbox, ".suboption")) {
            if (_checkbox.checked) enabledSuboptions.push(_checkbox.id);
        }
    }
    await settings.setSetting("enabled_scripts", enabled);
    await settings.setSetting("enabled_suboptions", enabledSuboptions);
    return enabled;
};

const loadOptions = async () => {
    // deserialize extension storage to options state
    let scripts = await settings.getEnabled();
    let checkboxes = [
        ...document.querySelectorAll(`
        input[type='checkbox'].script_check,
        input[type='checkbox'].suboption
    `),
    ];
    for (let script of scripts) {
        for (let checkbox of checkboxes) {
            let _checkbox = <HTMLInputElement>checkbox;
            if (common.elementMatches(checkbox, ".script_check")) {
                if (_checkbox.id === script) _checkbox.checked = true;
                let settingsChild = document.querySelector(`div#${_checkbox.id}_settings`);
                if (_checkbox.checked && settingsChild) settingsChild.classList.remove("hidden");
                else if (!_checkbox.checked && settingsChild) settingsChild.classList.add("hidden");
            } else if (common.elementMatches(_checkbox, ".suboption")) {
                let option = await settings.getEnabledSuboptions(_checkbox.id);
                if (option) _checkbox.checked = true;
            }
        }
        // put non-boolean load supports here
        if (script === "highlight_users") await showHighlightGroups();
        else if (script === "custom_user_filters") await showUserFilters();
    }
};

const saveOptions = async (e) => {
    if (e && e.target.id !== "clear_settings") {
        await getEnabledScripts();
        await loadOptions();
    }
};

const clearSettings = (e) =>
    settings
        .resetSettings()
        .then(loadOptions)
        .then(saveOptions(e))
        .then(() => {
            let settings_field = <HTMLInputElement>document.getElementById("import_export_field");
            if (settings_field) settings_field.value = "";
            handleImportExportField(); // force a field update
        });

/*
 *  Support import/export of the settings store
 */
const exportSettings = (settingsField) => {
    if (settingsField) {
        settings.getSettings().then(async (settings) => {
            // strip unnecessary cached keys
            const disallowed = [
                "highlight_groups",
                "collapsed_threads",
                "chatty_news_lastfetchdata",
                "chatty_news_lastfetchtime",
                "last_highlight_time",
                "new_comment_highlighter_last_id",
            ];
            const sanitizedGroups = settings.highlight_groups.filter((x) => !x.built_in) || [];
            const sanitizedSettings = common.objConditionalFilter(disallowed, settings);
            const exportable =
                sanitizedGroups.length > 0
                    ? JSON.stringify({
                          ...sanitizedSettings,
                          highlight_groups: sanitizedGroups,
                      })
                    : JSON.stringify(sanitizedSettings);
            settingsField.value = exportable;
            handleImportExportField(); // force a field update
            settingsField.select();
            document.execCommand("copy");
            alert("Copied current settings to clipboard!");
        });
    }
};

const importSettings = (settingsField) => {
    try {
        let parsedSettings = settingsField && JSON.parse(common.superTrim(settingsField.value));
        let defaults = { ...settings.DefaultSettings };
        // combine default and parsed highlight groups intelligently
        let reducedGroups = parsedSettings.highlight_groups
            ? parsedSettings.highlight_groups.reduce((acc, v) => {
                  let foundIdx = acc.findIndex((y) => y.name === v.name);
                  if (foundIdx > -1) acc[foundIdx] = v;
                  else acc.push(v);
                  return acc;
              }, defaults.highlight_groups)
            : defaults.highlight_groups;
        parsedSettings.highlight_groups = reducedGroups;
        let combinedSettings = { ...defaults, ...parsedSettings };
        if (combinedSettings)
            settings
                .resetSettings()
                .then(settings.setSettings(combinedSettings).then(() => alert("Successfully imported settings!")));
    } catch (e) {
        console.log(e);
        alert("Something went wrong when importing, check the console!");
    }
};

const handleImportExportField = () => {
    const field = <HTMLInputElement>document.getElementById("import_export_field");
    const importExportBtn = document.getElementById("import_export_btn");
    let result = parseSettingsString(field.value);
    if (result) importExportBtn.textContent = "Import Settings";
    else importExportBtn.textContent = "Export To Clipboard";
};

const handleImportExportSettings = () => {
    const field_limit = 5 * 1000 * 1000;
    let importExportField = <HTMLInputElement>document.getElementById("import_export_field");
    let field_val = importExportField && importExportField.value;
    if (field_val && field_val.length > field_limit) {
        // truncate to 5 MiB (max of extension storage)
        alert("Warning! Settings input must be less than 5MiB in size!");
        let _truncated = field_val.substring(0, field_limit);
        importExportField.value = _truncated;
    }
    if (importExportField && importExportField.value.length > 0) importSettings(importExportField);
    else if (importExportField) exportSettings(importExportField);
};

const parseSettingsString = (string) => {
    // rudimentary way of checking if a settings string is a valid JSON object
    try {
        let parsed = string && string.length > 0 && JSON.parse(common.superTrim(string));
        if (parsed && common.objContainsProperty("version", parsed)) return string;
        return false;
    } catch (e) {
        alert("Input is not a valid settings string!");
        (<HTMLInputElement>document.getElementById("import_export_field")).value = "";
        handleImportExportField(); // force a field update
        console.log(e);
        return false;
    }
};

/*
 * Options Event Handling Stuff
 */
const trackChanges = () => {
    let checkboxes = [
        ...document.querySelectorAll(`
        input[type='checkbox'].script_check,
        input[type='checkbox'].suboption
    `),
    ];
    for (let checkbox of checkboxes || []) {
        checkbox.removeEventListener("change", saveOptions);
        checkbox.addEventListener("change", saveOptions);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadOptions();
    trackChanges();
    document.getElementById("add_highlight_group").addEventListener("click", addHighlightGroup);
    document.getElementById("import_export_field").addEventListener("input", handleImportExportField);
    document.getElementById("import_export_btn").addEventListener("click", handleImportExportSettings);
    document.getElementById("clear_settings").addEventListener("click", clearSettings);
    document.getElementById("rls_notes").addEventListener("click", () => {
        browser.tabs.create({
            url: browser.runtime.getURL("release_notes.html"),
        });
        return false;
    });
});
