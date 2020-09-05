import { browser } from "webextension-polyfill-ts";

import { objEmpty, removeChildren, superTrim, elemMatches, objContainsProperty, safeInnerHTML } from "./core/common";
import {
    getEnabled,
    getSetting,
    getSettings,
    setSetting,
    setSettings,
    resetSettings,
    filtersContains,
    getEnabledSuboption,
    setHighlightGroup,
    highlightGroupContains,
    addHighlightUser,
    DefaultSettings,
    HighlightGroup,
    mergeHighlightGroups,
    migrateSettings,
    setEnabledSuboption,
    mergeUserFilters,
} from "./core/settings";

require("./styles/popup.css");

/*
 * Highlight Users' Support
 */

// https://stackoverflow.com/a/25873123
const randomHsl = () => `hsla(${getRandomNum(0, 360)}, ${getRandomNum(25, 100)}%, ${getRandomNum(35, 60)}%, 1)`;

const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (Math.ceil(max) - Math.floor(min))) + Math.ceil(min);

const getRandomNum = (min: number, max: number, precision?: number) =>
    parseFloat((Math.random() * (max - min) + min).toPrecision(precision ? precision : 1));

const trimName = (name: string) =>
    name
        .trim()
        .replace(/[\W\s]+/g, "")
        .toLowerCase();

const showHighlightGroups = async () => {
    const highlightGroups = document.getElementById("highlight_groups");
    removeChildren(highlightGroups);
    const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
    for (const group of groups || []) {
        addHighlightGroup(null, group);
    }
};

const getHighlightGroup = (groupElem?: HTMLElement) => {
    // serialize a highlight group
    if (groupElem) {
        const enabled = (groupElem.querySelector(".group_header input[type='checkbox']") as HTMLInputElement).checked;
        const name = (groupElem.querySelector(".group_label") as HTMLInputElement).value;
        const built_in = groupElem.querySelector(".group_label").hasAttribute("readonly");
        const css = (groupElem.querySelector(".group_css textarea") as HTMLInputElement).value;
        const users = [...(groupElem.querySelector(".group_select select") as HTMLSelectElement).options].map(
            (x) => x.text,
        );
        return { name, enabled, built_in, css, users } as HighlightGroup;
    }
    return {};
};

const getHighlightGroups = async () => {
    // serialize all existing highlight groups
    const activeGroups = [...document.querySelectorAll("#highlight_group")];
    const highlightRecords = [] as HighlightGroup[];
    for (const group of activeGroups || []) {
        const record = getHighlightGroup(group as HTMLElement);
        if (!objEmpty(record)) highlightRecords.push(record);
    }
    if (highlightRecords.length > 0) {
        return await setSetting("highlight_groups", highlightRecords);
    }
};

const newHighlightGroup = (name?: string, css?: string, username?: string) => {
    // return a new group with a random color as its default css
    return {
        enabled: true,
        name: name && name.length > 0 ? name : `New Group ${getRandomInt(1, 999999)}`,
        css: css && css.length > 0 ? css : `color: ${randomHsl()} !important;`,
        users: username && username.length > 0 ? [username] : [],
    } as HighlightGroup;
};

let debouncedUpdate = null as ReturnType<typeof setTimeout>;
const delayedTextUpdate = (e: Event) => {
    if (debouncedUpdate) clearTimeout(debouncedUpdate);
    debouncedUpdate = setTimeout(async () => {
        const this_node = e.target as HTMLElement;
        const groupElem = this_node.closest("#highlight_group") as HTMLInputElement;
        const groupLabel = groupElem.querySelector(".group_label") as HTMLLabelElement;
        const realGroupName = groupLabel.dataset.name;
        const updatedGroup = getHighlightGroup(groupElem);
        const updatedCSSField = groupElem.querySelector(".group_css textarea") as HTMLInputElement;
        const cssSplotch = groupElem.querySelector(".test_css span");
        if (updatedCSSField.value.length > 0) cssSplotch.setAttribute("style", superTrim(updatedCSSField.value));
        await setHighlightGroup(realGroupName, updatedGroup);
        groupLabel.dataset.name = updatedGroup.name;
    }, 500);
};

const addHighlightGroup = (e: Event, group?: HighlightGroup) => {
    e?.preventDefault();
    if (!group) group = newHighlightGroup();
    const groupElem = document.createElement("div");
    const trimmedName = trimName(group.name);
    groupElem.id = "highlight_group";
    safeInnerHTML(
        `<div class="group_header">
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
        </div>`,
        groupElem,
    );
    if (group.built_in) {
        // hide mutation interactions if userlist is readonly
        groupElem.querySelector("#remove_group").setAttribute("style", "display: none;");
        groupElem.querySelector(".group_select").setAttribute("style", "display: none;");
        groupElem.querySelector(".group_option_input").setAttribute("style", "display: none;");
    }
    for (const user of group.users || []) {
        const select = groupElem.querySelector(`#${trimmedName}_list`);
        const option = document.createElement("option");
        option.setAttribute("value", user);
        option.innerText = user;
        select.appendChild(option);
    }
    // handle Add, Remove, Remove Group, Toggle, and Text Changed states
    groupElem.querySelector("#option_add").addEventListener("click", async (e) => {
        const this_node = e?.target as HTMLElement;
        const this_input = this_node?.parentNode?.parentNode as HTMLInputElement;
        const optionContainer = this_node?.parentNode?.parentNode?.querySelector(
            ".group_select > select",
        ) as HTMLSelectElement;
        const username = this_node?.parentNode?.querySelector(".group_option_textinput") as HTMLInputElement;
        const groupName = (this_input?.querySelector(".group_label") as HTMLInputElement).value;
        let this_username = username?.value;
        const groupHas = await highlightGroupContains(groupName, this_username);
        if (groupHas) {
            alert("Highlight groups cannot contain duplicates!");
            this_username = "";
            return;
        }
        await addHighlightUser(groupName, this_username);
        const option = document.createElement("option");
        option.setAttribute("value", this_username);
        option.innerText = this_username;
        this_username = "";
        optionContainer?.appendChild(option);
    });
    groupElem.querySelector("#option_del").addEventListener("click", async (e) => {
        const this_node = e?.target as HTMLElement;
        const groupElem = this_node?.closest("#highlight_group") as HTMLElement;
        const groupName = (groupElem?.querySelector(".group_label") as HTMLInputElement)?.value;
        const usersSelect = groupElem?.querySelector("select") as HTMLSelectElement;
        for (const option of [...usersSelect.selectedOptions]) option?.parentNode?.removeChild(option);

        const updatedGroup = getHighlightGroup(groupElem);
        await setHighlightGroup(groupName, updatedGroup);
    });
    groupElem.querySelector("#remove_group").addEventListener("click", (e) => {
        const this_node = e?.target as HTMLElement;
        const groupElem = this_node?.closest("#highlight_group") as HTMLElement;
        const groupsContainer = this_node?.closest("#highlight_groups") as HTMLElement;
        groupsContainer?.removeChild(groupElem);
        getHighlightGroups();
    });
    groupElem.querySelector("input[type='checkbox']").addEventListener("click", async (e) => {
        const this_node = e?.target as HTMLElement;
        const groupElem = this_node?.closest("#highlight_group") as HTMLElement;
        const groupName = (groupElem?.querySelector(".group_label") as HTMLInputElement).value;
        const updatedGroup = getHighlightGroup(groupElem);
        await setHighlightGroup(groupName, updatedGroup);
    });
    groupElem.querySelector("select").addEventListener("change", (e) => {
        const this_node = e?.target as HTMLSelectElement;
        const groupElem = this_node?.closest("#highlight_group") as HTMLElement;
        const selected = this_node?.options?.selectedIndex;
        const removeBtn = groupElem?.querySelector("#option_del");
        if (selected > -1) removeBtn?.removeAttribute("disabled");
        else if (selected === -1) removeBtn?.setAttribute("disabled", "");
    });
    // let the user switch colors by clicking the preview splotch
    groupElem.querySelector(".test_css span").addEventListener("click", (e) => {
        const this_node = e?.target as HTMLElement;
        const group = this_node?.closest("#highlight_group") as HTMLElement;
        const styleField = group?.querySelector(".group_css textarea") as HTMLInputElement;
        let firstColor: string;
        const style = styleField?.value?.replace(/((?:\s*?)color:.+?;)/gim, (m, g1) => {
            // allow only two color rules, the original and our test rule
            if (!firstColor) {
                firstColor = g1;
                return g1;
            } else {
                return "";
            }
        });
        styleField.value = superTrim(`${style} color: ${randomHsl()} !important;`);
        delayedTextUpdate(e); // fire off a css field update
    });
    // handle changes on mutable text fields with a debounce
    const textfields = [...groupElem.querySelectorAll(".group_css textarea, .group_label")];
    for (const textfield of textfields || []) {
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
    const filters = (await getSetting("user_filters")) as string[];
    const usersLst = document.getElementById("filtered_users") as HTMLSelectElement;
    removeChildren(usersLst);

    for (const filter of filters || []) {
        const newOption = document.createElement("option");
        newOption.textContent = filter;
        newOption.value = filter;
        usersLst.appendChild(newOption);
    }

    const addFilterBtn = document.getElementById("add_user_filter_btn");
    addFilterBtn.removeEventListener("click", addUserFilter);
    addFilterBtn.addEventListener("click", addUserFilter);
    const delFilterBtn = document.getElementById("remove_user_filter_btn");
    delFilterBtn.removeEventListener("click", removeUserFilter);
    delFilterBtn.addEventListener("click", removeUserFilter);
    usersLst.removeEventListener("change", filterOptionsChanged);
    usersLst.addEventListener("change", filterOptionsChanged);
};

const filterOptionsChanged = (e: Event) => {
    const filterElem = (e.target as HTMLSelectElement).closest("#custom_user_filters_settings");
    const selected = (<HTMLSelectElement>document.getElementById("filtered_users")).options.selectedIndex;
    const removeBtn = filterElem.querySelector("#remove_user_filter_btn");
    if (selected > -1) removeBtn.removeAttribute("disabled");
    else if (selected === -1) removeBtn.setAttribute("disabled", "");
};

const getUserFilters = async () => {
    // serialize user filters to extension storage
    const usersLst = document.getElementById("filtered_users") as HTMLSelectElement;
    const users = [...usersLst.options].map((x) => x.text);
    const fullpostHider = <HTMLInputElement>document.getElementById("cuf_hide_fullposts");
    if (fullpostHider) await setSetting(fullpostHider.id, fullpostHider.checked);
    return await setSetting("user_filters", users);
};

const addUserFilter = async () => {
    const username = document.getElementById("new_user_filter_text") as HTMLInputElement;
    const usersLst = document.getElementById("filtered_users");
    const filtersHas = await filtersContains(username.value);
    if (filtersHas) {
        alert("Filters cannot contain duplicates!");
        username.value = "";
        return;
    }
    const newOption = document.createElement("option");
    newOption.textContent = username.value;
    newOption.value = username.value;
    usersLst.appendChild(newOption);
    username.value = "";
    await getUserFilters();
};

const removeUserFilter = async () => {
    const selectElem = document.getElementById("filtered_users") as HTMLSelectElement;
    const removeBtnElem = document.getElementById("remove_user_filter_btn");
    const selectedOptions = [...selectElem.selectedOptions];
    for (const option of selectedOptions || []) option.parentNode.removeChild(option);
    removeBtnElem.setAttribute("disabled", "");
    await getUserFilters();
};

/*
 * Options Serialization/Deserialization
 */
const getEnabledScripts = async () => {
    // serialize checkbox/option state to extension storage
    const enabled = [];
    const enabledSuboptions = [];
    const checkboxes = [
        ...document.querySelectorAll(`
        input[type='checkbox'].script_check,
        input[type='checkbox'].suboption
    `),
    ];
    for (const checkbox of checkboxes) {
        const _checkbox = checkbox as HTMLInputElement;
        if (elemMatches(_checkbox, ".script_check") && _checkbox.checked) {
            // put non-boolean save supports here
            enabled.push(_checkbox.id);
        } else if (elemMatches(_checkbox, ".suboption")) {
            if (_checkbox.checked) enabledSuboptions.push(_checkbox.id);
        }
    }
    await setSetting("enabled_scripts", enabled);
    await setSetting("enabled_suboptions", enabledSuboptions);
    return enabled;
};

const loadOptions = async () => {
    // deserialize extension storage to options state
    const scripts = await getEnabled();
    const checkboxes = [
        ...document.querySelectorAll(`
        input[type='checkbox'].script_check,
        input[type='checkbox'].suboption
    `),
    ] as HTMLInputElement[];

    for (const checkbox of checkboxes) {
        if (elemMatches(checkbox, ".script_check")) {
            const script = await getEnabled(checkbox.id);
            if (checkbox.id === script) checkbox.checked = true;
            else checkbox.checked = false;
            const settingsChild = document.querySelector(`div#${checkbox.id}_settings`);
            if (checkbox.checked && settingsChild) settingsChild.classList.remove("hidden");
            else if (!checkbox.checked && settingsChild) settingsChild.classList.add("hidden");
        } else if (elemMatches(checkbox, ".suboption")) {
            const option = await getEnabledSuboption(checkbox.id);
            if (option) checkbox.checked = true;
            else checkbox.checked = false;
        } else if (checkbox.id !== scripts) checkbox.checked = false;
    }

    if (await getEnabled("highlight_users")) {
        await showHighlightGroups();
    } else if (await getEnabled("custom_user_filters")) {
        await showUserFilters();
    }
};

const saveOptions = (e: MouseEvent) => {
    (async () => {
        const this_node = e?.target as HTMLButtonElement;
        if (this_node?.id !== "clear_settings") {
            await getEnabledScripts();
            await loadOptions();
        }
    })();
};

const clearSettings = (e: MouseEvent) => {
    (async () => {
        await resetSettings();
        await loadOptions();
        saveOptions(e);
        // force a field update
        const settings_field = <HTMLInputElement>document.getElementById("import_export_field");
        if (settings_field) settings_field.value = "";
        handleImportExportField();
    })();
};

/*
 *  Support import/export of the settings store
 */

const objConditionalFilter = (disallowed: string[], obj: Record<string, any>) => {
    return Object.keys(obj)
        .filter((k) => !disallowed.includes(k))
        .reduce((o, k) => {
            return { ...o, [k]: obj[k] };
        }, {});
};

const exportSettings = async (settingsField: HTMLInputElement) => {
    try {
        if (settingsField) {
            const settings = await getSettings();
            // strip unnecessary cached keys
            const disallowed = [
                "highlight_groups",
                "collapsed_threads",
                "chatty_news_lastfetchdata",
                "chatty_news_lastfetchtime",
                "last_highlight_time",
                "new_comment_highlighter_last_id",
                "nEventId",
                "nUsername",
            ];
            const disallowedOptions = ["show_rls_notes", "imported"];

            const mutableGroups = settings.highlight_groups.filter((x: HighlightGroup) => !x.built_in) || [];
            const allowedSettings = objConditionalFilter(disallowed, settings);
            const allowedSuboptions = disallowedOptions.reduce((acc, so) => {
                const foundIdx = acc.findIndex((x) => x.toUpperCase() === so.toUpperCase());
                if (foundIdx !== -1) acc.splice(foundIdx);
                return acc;
            }, settings.enabled_suboptions as string[]);

            const mutated = {
                ...allowedSettings,
                enabled_suboptions: allowedSuboptions,
                highlight_groups: mutableGroups,
            };
            const exportable = JSON.stringify(mutated, null, 2);
            settingsField.value = exportable;
            handleImportExportField(); // force a field update
            settingsField.select();
            document.execCommand("copy");
            alert("Copied current settings to clipboard!");
            return true;
        }
    } catch (e) {
        console.log("Something went wrong:", e);
        return false;
    }
};

const importSettings = async (settingsField: HTMLInputElement) => {
    try {
        const parsedSettings = settingsField && JSON.parse(superTrim(settingsField.value));
        // combine default and parsed highlight groups intelligently
        const mergedGroups =
            parsedSettings.highlight_groups && (await mergeHighlightGroups(parsedSettings.highlight_groups));
        parsedSettings.highlight_groups = mergedGroups;
        const sanitizedUserFilters = await mergeUserFilters(parsedSettings.user_filters);
        parsedSettings.user_filters = sanitizedUserFilters;
        const combinedSettings = { ...DefaultSettings, ...parsedSettings };
        // merge settings and migrate any legacy options
        await setSettings(combinedSettings);
        await setEnabledSuboption("imported");
        await migrateSettings();
        return true;
    } catch (e) {
        console.error(e);
        alert("Something went wrong when importing, check the console!");
        return false;
    }
};

const handleImportExportField = () => {
    const field = document.getElementById("import_export_field") as HTMLInputElement;
    const importExportBtn = document.getElementById("import_export_btn") as HTMLButtonElement;
    const result = parseSettingsString(field.value);
    if (result) importExportBtn.textContent = "Import Settings";
    else importExportBtn.textContent = "Export To Clipboard";
};

const handleImportExportSettings = () => {
    const field_limit = 5 * 1000 * 1000;
    const importExportField = document.getElementById("import_export_field") as HTMLInputElement;
    (async () => {
        if (importExportField?.value?.length > field_limit) {
            // truncate to 5 MiB (max of extension storage)
            alert("Warning! Settings input must be less than 5MiB in size!");
            const _truncated = importExportField.value.substring(0, field_limit);
            importExportField.value = _truncated;
        }
        if (importExportField?.value?.length > 0) {
            const result = await importSettings(importExportField);
            if (result) {
                alert("Successfully imported!");
                importExportField.value = "";
                handleImportExportField();
                await loadOptions();
            }
        } else if (importExportField) await exportSettings(importExportField);
    })();
};

const parseSettingsString = (input: string) => {
    // rudimentary way of checking if a settings string is a valid JSON object
    try {
        const parsed = input?.length > 0 && JSON.parse(superTrim(input));
        if (parsed && objContainsProperty("version", parsed)) return input;
        return false;
    } catch (e) {
        alert("Input is not a valid settings string!");
        const importExportField = document.getElementById("import_export_field") as HTMLInputElement;
        if (importExportField) importExportField.value = "";
        handleImportExportField(); // force a field update
        console.error(e);
        return false;
    }
};

/*
 * Options Event Handling Stuff
 */
const trackChanges = () => {
    const checkboxes = [
        ...document.querySelectorAll(`
        input[type='checkbox'].script_check,
        input[type='checkbox'].suboption
    `),
    ];
    for (const checkbox of checkboxes || []) {
        checkbox.removeEventListener("change", saveOptions);
        checkbox.addEventListener("change", saveOptions);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    try {
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
    } catch (e) {
        console.error(e);
    }
});
