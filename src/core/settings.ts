import { browser } from "webextension-polyfill-ts";

import { arrHas, objEmpty, superTrim, objContains } from "./common";

export interface HighlightGroup {
    name?: string;
    enabled?: boolean;
    built_in?: boolean;
    css?: string;
    users?: string[];
}
export interface Settings {
    [x: string]: any;
    enabled_scripts?: string[];
    enabled_suboptions?: string[];
    collapsed_threads?: string[];
    user_filters?: string[];
    highlight_groups?: HighlightGroup[];
    nEventId?: number;
    nUsername?: string;
}

export const DefaultSettings: Settings = {
    enabled_scripts: [
        "shrink_user_icons",
        "reduced_color_user_icons",
        "media_loader",
        "social_loader",
        "getpost",
        "nws_incognito",
        "new_comment_highlighter",
        "highlight_users",
        "custom_user_filters",
        "post_preview",
    ],

    enabled_suboptions: ["cuf_hide_fullposts"],

    collapsed_threads: [],

    user_filters: [],

    highlight_groups: [
        {
            name: "Original Poster",
            enabled: true,
            built_in: true,
            css: "font-weight: bold; color: yellow;",
        },
        {
            name: "Mods",
            enabled: true,
            built_in: true,
            css: "color: red !important;",
        },
        {
            name: "Employees",
            enabled: true,
            built_in: true,
            css: "color: green !important;",
            users: [
                "Steve Gibson",
                "Maarten Goldstein",
                "Chris Faylor",
                "Nick Breckon",
                "Aaron Linde",
                "Alice O'Conner",
                "Jeff Mattas",
                "Garnett Lee",
                "Brian Leahy",
                "Ackbar2020",
                "greg-m",
                "XAVdeMATOS",
                "Shacknews",
                "sHugamom",
                "Chris Remo",
                "TylerJSmith",
                "OzzieMejia",
                "John Keefer",
                "Keefinator",
                "Andrew Yoon",
                "the man with the briefcase",
                "staymighty",
                "xosammyjoe",
                "hammersuit",
                "Steve Watts",
                "SporkyReeve",
                "Daniel Perez",
                "Daniel_Perez",
                "Greg Burke",
                "GBurke59",
                "joshua hawkins",
                "steven wong",
                "squid wizard",
                "beardedaxe",
                "Crabs Jarrard",
                "David Craddock",
                "Charles Singletary Jr",
            ],
        },
        {
            name: "Game Devs",
            enabled: true,
            built_in: true,
            css: "color: purple !important;",
            users: [
                "jason bergman",
                "dahanese", // 2K Games
                "OverloadUT", // 2K Sports
                "georgeb3dr",
                "Joe3DR",
                "Mr. 9000",
                "Scatti",
                "ScottMi11er", // 3D Realms
                "Dravalen", // Airtight Games
                "fredrik s", // Affectworks
                "derean", // Artificial Mind & Movement
                "YoYo", // Atari (Dallas)
                "lplasmatron",
                "speon", // Bethesda Softworks
                "Derek French", // Bioware
                "dmiller", // Bungie
                "Karnov", // Buzz Monkey
                "aavenr",
                "-efx-", // Digital Illusions CE (Sweden)
                "timmie", // EA Canada
                "CliffyB",
                "fufux", // Epic
                "jbury", // Free Radical Design
                "Ivan Sulic", // Flagship Studios
                "Torque X",
                "d3tached",
                "sullisnack", // Garage Games
                "timaste",
                "timmytaste", // Indie Contractor
                "hellchick", // Gas Powered Games
                "rickmus",
                "byorn",
                "DaMojo",
                "duvalmagic",
                "kungfusquirrel",
                "MADMikeDavis",
                "mikeyzilla",
                "wieder",
                "dopefish", // Gearbox
                "threeup", // hb-studios
                "lvlmaster",
                "zeroprey", // Human Head
                "patd",
                "toddh",
                "xian", // id Software
                "Avatar",
                "DKo5",
                "Inherent", // Infinity Ward
                "SilverSnake", // Massive
                "cannelbrae", // Monolith
                "cpnkegel",
                "Cowbs", // Naughty Dog
                "Zoid", // NCSoft
                "Normality", // Nerve
                "Jabby", // Obsidian
                "darweidu",
                "Freshview",
                "gndagger",
                "Rampancy",
                "sammyl",
                "tostador", // Pandemic
                "Buckyfg1", // Piranha
                "cheshirecat", // Planet Moon
                "PetriRMD", // Remedy
                "Andy Hanson", // Retro
                "Jack Mathews", // Retro
                "bozer", // Rockstar
                "s2jason", // S2 Games
                "bakanoodle", // Slant Six
                "mittense", // Stardock
                "AshenTemper", // Stray Bullet
                "dtabacco",
                "jake2000",
                "mikeycyb", // TellTale
                "brome", // ThreeWave
                "Krypt_", // Treyarch
                "Ease_One", // Trauma
                "mnok",
                "MrLobo", // Ubisoft
                "Doug_Support",
                "Erik Johnson",
                "garymct",
                "locash",
                "RobinWalker", // Valve
                "ColoradoCNC",
                "Pezman", // Vivendi
                "Knytehawkk", // Zemnott
                "deveus1", // Activision
                "lord cecil", // Uber
                "eonix", // Relic
                "whippedcracker", // Vigil
                "Fred Garvin", // former BioWare
                "Omning",
                "robinchyo",
                "Romsteady",
                "drhazard", // Volition
                "freakynipples69", // MindShaft
            ],
        },
        {
            name: "Friends",
            enabled: true,
            built_in: false,
            css: "border: 1px dotted white !important;",
            users: [],
        },
    ],
};

/// GETTERS

export const getSettingsVersion = async () => (await getSetting("version", 0)) as number;
export const getManifestVersion = () => parseFloat(browser.runtime.getManifest().version);

export const getSetting = async (key: string, defaultVal?: any) => {
    const settings = await getSettings();
    if (!settingsContains(key)) setSetting(key, defaultVal);
    return settings[key] || null;
};
export const getSettings = async () => {
    let settings = (await browser.storage.local.get()) as Settings;
    if (objEmpty(settings)) {
        await browser.storage.local.set(DefaultSettings);
        settings = browser.storage.local.get();
    }
    return settings;
};

export const getEnabled = async (key?: string) => {
    const enabled = (await getSetting("enabled_scripts")) as string[];
    if (!key) return enabled;
    return enabled.find((v) => v === key) || null;
};

export const getEnabledSuboptions = async () => {
    const enabled = ((await getSetting("enabled_suboptions")) || []) as string[];
    return enabled || null;
};

export const getEnabledSuboption = async (key: string) => {
    const suboptions = ((await getEnabledSuboptions()) || []) as string[];
    const found = suboptions.find((x) => x.toUpperCase() === key.toUpperCase());
    return found || null;
};

export const getSettingsLegacy = () => {
    const settings = { ...localStorage };
    for (const key of Object.keys(settings) || [])
        if (/[A-F0-9]{8}-(?:[A-F0-9]{4}-){3}[A-F0-9]{12}/.test(settings[key]))
            settings[key] = JSON.parse(settings[key]);
        else if (!isNaN(parseFloat(JSON.parse(settings[key])))) settings[key] = parseFloat(JSON.parse(settings[key]));
        else settings[key] = JSON.parse(settings[key]);

    return settings;
};

export const getMutableHighlights = async () => {
    const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
    return groups.filter((x: HighlightGroup) => !x.built_in && x.users) || null;
};

/// SETTERS

export const updateSettingsVersion = async () => {
    const manifestVersion = getManifestVersion();
    const settingsVersion = await getSettingsVersion();
    if (!settingsVersion || manifestVersion !== settingsVersion) await setSetting("version", manifestVersion || 0);

    return manifestVersion;
};

export const setEnabled = async (key: string) => {
    const scripts = (await getEnabled()) as string[];
    if (!scripts.includes(key) && key.length > 0) scripts.push(key);
    return await setSetting("enabled_scripts", scripts);
};

export const setEnabledSuboption = async (key: string) => {
    const options = (await getEnabledSuboptions()) as string[];
    if (!options.includes(key) && key.length > 0) options.push(key);
    return await setSetting("enabled_suboptions", options);
};

export const setSetting = async (key: string, val: any) => await browser.storage.local.set({ [key]: val });

export const setSettings = async (obj: Settings) => {
    await browser.storage.local.clear();
    return await browser.storage.local.set(obj);
};

export const setHighlightGroup = async (groupName: string, obj: HighlightGroup) => {
    // for overwriting a specific highlight group by name
    const records = (await getSetting("highlight_groups")) as HighlightGroup[];
    const indexMatch = records.findIndex((x: HighlightGroup) => x.name.toLowerCase() === groupName.toLowerCase());
    // overwrite at index if applicable (append otherwise)
    if (indexMatch > -1) records[indexMatch] = obj;
    else records.push(obj);
    if (records) return setSetting("highlight_groups", records);
};

/// REMOVERS

export const removeEnabled = async (key: string) => {
    const scripts = ((await getEnabled()) || []) as string[];
    const filtered = scripts.filter((x) => x !== key) || [];
    await setSetting("enabled_scripts", filtered);
    return filtered;
};

export const removeEnabledSuboption = async (key: string) => {
    const options = ((await getEnabledSuboptions()) || []) as string[];
    const filtered = options.filter((x) => x !== key) || [];
    await setSetting("enabled_suboptions", filtered);
    return filtered;
};

export const removeSetting = (key: string) => browser.storage.local.remove(key);

export const resetSettings = async () => {
    await browser.storage.local.clear();
    return await getSettings();
};

export const removeHighlightGroup = async (groupName: string) => {
    // for removing a highlight group while preserving record order
    const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
    const selected = groups.filter((x) => x.name !== groupName) || null;
    for (const group of selected || []) await setHighlightGroup(groupName, group);
    // return the sliced records from the settings store
    return (await getSetting("highlight_groups")) as HighlightGroup[];
};

export const removeHighlightUser = async (groupName: string, username: string) => {
    const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
    const filtered = groups.filter((x) => x.name === groupName);
    for (const group of filtered || []) {
        const mutated = group.users.filter((x) => x && x.toLowerCase() !== superTrim(username.toLowerCase())) || null;
        if (mutated) group.users = mutated;
        await setHighlightGroup(group.name, group);
    }
};

export const removeFilter = async (username: string) => {
    const filters = ((await getSetting("user_filters")) || []) as string[];
    const filtered = filters.filter((y) => y.toLowerCase() !== username.toLowerCase()) || [];
    await setSetting("user_filters", filtered);
    return filtered;
};

/// CONTAINERS

export const settingsContains = async (key: string) => {
    const settings = (await getSettings()) as Settings;
    return objContains(key, settings);
};

export const enabledContains = async (key: string) => {
    const enabled = await getEnabled();
    return enabled ? enabled.includes(key) : false;
};

export const highlightsContains = async (username: string): Promise<HighlightGroup[]> => {
    // return all group matches based on username
    return (await getMutableHighlights()).filter((x: HighlightGroup) =>
        x.users.find((y) => y.toLowerCase() === superTrim(username.toLowerCase())),
    );
};

export const highlightGroupContains = async (groupName: string, username: string) => {
    const groups = await highlightsContains(username);
    for (const group of groups || []) if (group.name === groupName) return group;
    return null;
};

export const filtersContains = async (username: string): Promise<string> => {
    const filters = (await getSetting("user_filters")) as string[];
    return filters.find((x) => x && x.toLowerCase() === superTrim(username.toLowerCase())) || null;
};

export const addHighlightUser = async (groupName: string, username: string) => {
    const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
    const filtered = groups.filter((x) => x.name === groupName) || null;
    for (const group of filtered || []) {
        const mutated = [...group.users, username];
        group.users = mutated;
        await setHighlightGroup(group.name, group);
    }
};

export const addFilter = async (username: string) => {
    if (!(await filtersContains(username))) {
        const filters = (await getSetting("user_filters")) as string[];
        const mutated = [...filters, username];
        await setSetting("user_filters", mutated);
    }
};

/// SETTINGS MIGRATION

export const mergeUserFilters = async (newUsers: string[]) => {
    const oldUsers = ((await getSetting("user_filters")) || []) as string[];
    return arrHas(newUsers)
        ? newUsers.reduce((acc, u) => {
              // don't allow duplicate usernames
              const found = acc.find((x) => x.toUpperCase() === u.toUpperCase());
              if (!found) acc.push(u);
              return acc;
          }, oldUsers)
        : [];
};

export const mergeHighlightGroups = async (newGroups: HighlightGroup[]) => {
    const oldGroups = (await getSetting("highlight_groups")) as HighlightGroup[];
    const builtinGroups = arrHas(oldGroups) ? oldGroups.filter((g) => g.built_in) : [];
    // try to intelligently merge default, old, and parsed groups
    return arrHas(newGroups)
        ? newGroups.reduce((acc, v) => {
              // compare ordinal group names (users can exist in multiple groups)
              const foundIdx = acc.findIndex((y) => y.name?.toUpperCase() === v.name?.toUpperCase());
              // update existing member with the newest duplicate group found
              if (foundIdx > -1) {
                  acc[foundIdx] = v;
              } else {
                  // only allow unique users in a given group (compare ordinal name)
                  const uniqueUsers = v.users?.filter(
                      (x, i, s) => s.findIndex((y) => y.toUpperCase() === x.toUpperCase()) === i,
                  );
                  if (uniqueUsers) v.users = uniqueUsers;
                  // a group name is required to accumulate
                  if (v.name) acc.push(v);
              }
              return acc;
          }, builtinGroups)
        : [];
};

export const mergeSettings = async (newSettings: { [key: string]: any }) => {
    // pass in an object named for the settings options we want to mutate
    // to rename if found, pass: { option_name: [{ old: "...", new: "..." }] }
    // to remove in a list if found, pass: { option_name: [{ old: "...", new: null }] }
    // to remove if found, pass: { option_name: null }
    const settings = await getSettings();
    for (const [key, val] of Object.entries(newSettings))
        if (arrHas(val) && settings[key])
            for (const v of val) {
                const foundIdx = (settings[key] as string[]).findIndex((x) => x === v.old);
                // mutate array and leave no duplicate options/sub-options
                if (foundIdx > -1 && v.new) {
                    settings[key][foundIdx] = v.new;
                    settings[key] = (settings[key] as string[]).filter((x, i, s) => s.indexOf(x) === i);
                } else if (foundIdx > -1 && v.new === null) {
                    settings[key] = (settings[key] as string[])
                        .splice(foundIdx)
                        .filter((x, i, s) => s.indexOf(x) === i);
                }
            }
        else if (val === null && key && settings[key]) delete settings[key];

    return settings;
};

export const migrateSettings = async () => {
    const legacy_settings = getSettingsLegacy();
    let current_version = getManifestVersion();
    let last_version = (await getSettingsVersion()) || current_version;
    if (legacy_settings && legacy_settings["version"] <= 1.63) {
        // quick reload of default settings from nuStorage
        await resetSettings().then(getSettings);
        // preserve previous convertible filters and notifications state
        const prevFilters = legacy_settings["user_filters"] || null;
        const prevNotifyUID = legacy_settings["notificationuid"] || null;
        const prevNotifyState = legacy_settings["notifications"] || null;
        if (prevFilters) await setSetting("user_filters", prevFilters);
        if (prevNotifyUID && prevNotifyState) await setEnabled("enable_notifications");
        window.localStorage.clear();
    }
    if (last_version <= 1.68 && last_version >= 1.64) {
        // migrate pre-1.69 settings
        const settingsMutation = {
            enabled_scripts: [
                { old: "image_loader", new: "media_loader" },
                { old: "video_loader", new: "media_loader" },
                { old: "embed_socials", new: "social_loader" },
            ],
            enabled_suboptions: [{ old: "es_show_tweet_threads", new: "sl_show_tweet_threads" }],
            notificationuid: null as unknown,
        };
        const mutatedSettings = await mergeSettings(settingsMutation);
        await setSettings(mutatedSettings);
    }

    // pull the latest version data after the migration
    current_version = getManifestVersion();
    last_version = (await getSettingsVersion()) || current_version;
    if (last_version !== current_version) {
        await setEnabledSuboption("show_rls_notes");
        await updateSettingsVersion();
    } else {
        await updateSettingsVersion();
    }
    // only show release notes automatically once after the version is updated
    const show_notes = await getEnabledSuboption("show_rls_notes");
    const imported = await getEnabledSuboption("imported");
    if (show_notes && !imported) {
        await browser.tabs.create({ url: "release_notes.html" });
        await removeEnabledSuboption("show_rls_notes");
    }
    await removeEnabledSuboption("imported");
};
