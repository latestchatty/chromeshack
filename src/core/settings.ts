import { importSettings } from "../PopupApp/helpers";
import { arrHas, objEmpty, objHas } from "./common/common";
import { superTrim } from "./common/dom";
import { DefaultSettings } from "./default_settings";

/// GETTERS

export const getSettings = async (defaults?: Settings) => {
  try {
    let settings = (await chrome.storage.local.get()) as Settings;
    if (objEmpty(settings) && !defaults) {
      await chrome.storage.local.set({ ...DefaultSettings, ...settings });
      settings = (await chrome.storage.local.get()) as Settings;
    } else if (defaults) {
      await chrome.storage.local.set(defaults);
      settings = defaults;
    }
    return settings;
  } catch (e) {
    if (e) console.error(e);
  }
};

export const setSetting = async (key: SettingKey, val: any) => {
  // Check each time we set a key that the val will fit within the storage limit
  // ... if we don't do this then the settings store can become corrupted
  // ... causing data loss of some kv-pairs.
  const maxSize = 5000000; // the limit is 5MiB for chrome.storage.local
  const _settings = await getSettings();
  const _newVal = { [key]: val };
  const _withVal = { ..._settings, ..._newVal };
  const _newSetLen = JSON.stringify(_withVal).length;
  if (_newSetLen < maxSize) await chrome.storage.local.set(_newVal);
  else
    console.error(
      "Unable to write value - would cause storage overflow:",
      _withVal,
      _newSetLen
    );
};

export const getSetting = async (key: SettingKey, defaultVal?: any) => {
  const settings = (await getSettings()) as Settings;
  const found = settings[key];
  // overwrite key with default (if provided)
  if (found == null && defaultVal != null) setSetting(key, defaultVal);
  return found != null ? found : defaultVal ?? null;
};

export const getSettingsVersion = async () => await getSetting("version", 0);
export const getManifestVersion = () =>
  parseFloat(chrome.runtime.getManifest().version);

export const getEnabled = async (key?: EnabledOptions) => {
  const enabled = (await getSetting("enabled_scripts")) as string[];
  if (!key) return enabled;
  return enabled.find((v) => v === key) || null;
};

export const getEnabledSuboptions = async () => {
  const enabled = (await getSetting("enabled_suboptions")) as string[];
  return enabled || null;
};

export const getEnabledSuboption = async (key: EnabledSuboptions) => {
  const suboptions = (await getEnabledSuboptions()) as string[];
  return suboptions.find((x) => x.toUpperCase() === key.toUpperCase()) || null;
};

export const getSettingsLegacy = async () => {
  const storage = await chrome.storage.local.get();
  const settings = { ...DefaultSettings, ...storage };
  // for (const key of Object.keys(settings) || [])
  //     if (/[A-F0-9]{8}-(?:[A-F0-9]{4}-){3}[A-F0-9]{12}/.test(settings[key]))
  //         settings[key] = JSON.parse(settings[key]);
  //     else if (!isNaN(parseFloat(JSON.parse(settings[key])))) settings[key] = parseFloat(JSON.parse(settings[key]));
  //     else settings[key] = JSON.parse(settings[key]);

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
  if (!settingsVersion || manifestVersion !== settingsVersion)
    await setSetting("version", manifestVersion || 0);

  return manifestVersion;
};

export const setEnabled = async (key: EnabledOptions) => {
  const scripts = (await getEnabled()) as string[];
  if (!scripts.includes(key) && key.length > 0) scripts.push(key);
  return await setSetting("enabled_scripts", scripts);
};

export const setEnabledSuboption = async (key: EnabledSuboptions) => {
  const options = (await getEnabledSuboptions()) as string[];
  if (!options.includes(key) && key.length > 0) options.push(key);
  return await setSetting("enabled_suboptions", options);
};

export const setSettings = async (obj: Settings) => {
  await chrome.storage.local.clear();
  return await chrome.storage.local.set(obj);
};

export const setHighlightGroup = async (
  groupName: string,
  obj: HighlightGroup
) => {
  // for overwriting a specific highlight group by name
  const records = (await getSetting("highlight_groups")) as HighlightGroup[];
  const indexMatch = records.findIndex(
    (x: HighlightGroup) => x.name.toLowerCase() === groupName.toLowerCase()
  );
  // overwrite at index if applicable (append otherwise)
  if (indexMatch > -1) records[indexMatch] = obj;
  else records.push(obj);
  if (records) return setSetting("highlight_groups", records);
};

/// REMOVERS

export const removeEnabled = async (key: EnabledOptions) => {
  const scripts = (await getEnabled()) as string[];
  const filtered = scripts.filter((x) => x !== key) || [];
  await setSetting("enabled_scripts", filtered);
  return filtered;
};

export const removeEnabledSuboption = async (key: EnabledSuboptions) => {
  const options = ((await getEnabledSuboptions()) || []) as string[];
  const filtered = options.filter((x) => x !== key) || [];
  await setSetting("enabled_suboptions", filtered);
  return filtered;
};

export const removeSetting = (key: SettingKey) =>
  chrome.storage.local.remove(key);

export const resetSettings = async (defaults?: Settings) => {
  await chrome.storage.local.clear();
  return await getSettings(defaults);
};

export const removeHighlightUser = async (
  groupName: string,
  username: string
) => {
  const groups = (await getSetting("highlight_groups")) as HighlightGroup[];
  const filtered = groups.filter((x) => x.name === groupName);
  for (const group of filtered || []) {
    const mutated =
      group.users.filter(
        (x) => x && x.toLowerCase() !== superTrim(username.toLowerCase())
      ) || null;
    if (mutated) group.users = mutated;
    await setHighlightGroup(group.name, group);
  }
};

export const removeFilter = async (username: string) => {
  const filters = ((await getSetting("user_filters")) || []) as string[];
  const filtered =
    filters.filter((y) => y.toLowerCase() !== username.toLowerCase()) || [];
  await setSetting("user_filters", filtered);
  return filtered;
};

/// CONTAINERS

export const enabledContains = async (keys: EnabledOptions[]) => {
  const enabled = (await getEnabled()) as EnabledOptions[];
  for (const key of keys || []) if (enabled.includes(key)) return true;
  return false;
};

export const highlightsContains = async (
  username: string
): Promise<HighlightGroup[]> => {
  // return all group matches based on username
  return (await getMutableHighlights()).filter((x: HighlightGroup) =>
    x.users.find((y) => y.toLowerCase() === superTrim(username.toLowerCase()))
  );
};

export const highlightGroupContains = async (
  groupName: string,
  username: string
) => {
  const groups = await highlightsContains(username);
  for (const group of groups || []) if (group.name === groupName) return group;
  return null;
};

export const highlightGroupsEqual = (
  groupA: HighlightGroup,
  groupB: HighlightGroup
) => {
  // deep equality check of two HighlightGroups by ordinality
  if (!objHas(groupA) || !objHas(groupB)) return false;
  const {
    built_in: built_inA,
    enabled: enabledA,
    name: nameA,
    css: cssA,
    users: usersA,
  } = groupA;
  const {
    built_in: built_inB,
    enabled: enabledB,
    name: nameB,
    css: cssB,
    users: usersB,
  } = groupB;
  if (built_inA !== built_inB || enabledA !== enabledB) return false;
  if (
    nameA.toUpperCase() !== nameB.toUpperCase() ||
    cssA.toUpperCase() !== cssB.toUpperCase()
  )
    return false;
  if (
    usersA?.length !== usersB?.length ||
    (!usersA && usersB) ||
    (!usersB && usersA)
  )
    return false;
  for (const userA of usersA || []) if (!usersB.includes(userA)) return false;
  return true;
};

export const filtersContains = async (username: string): Promise<string> => {
  const filters = (await getSetting("user_filters")) as string[];
  return (
    filters.find(
      (x) => x && x.toLowerCase() === superTrim(username.toLowerCase())
    ) || null
  );
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

export const mergeHighlightGroups = async (
  newGroups: HighlightGroup[],
  oldGroups: HighlightGroup[]
) => {
  const builtinGroups = arrHas(oldGroups)
    ? oldGroups.filter((g) => g.built_in)
    : [];
  // try to intelligently merge default, old, and new groups
  return arrHas(newGroups)
    ? newGroups.reduce((acc, g) => {
        // compare ordinal group names (users can exist in multiple groups)
        const foundIdx = acc.findIndex(
          (y) => y?.name?.toUpperCase() === g?.name?.toUpperCase()
        );
        // update existing builtin with the fresh group (preserving defaults)
        if (foundIdx > -1)
          acc[foundIdx] = { ...acc[foundIdx], enabled: g.enabled, css: g.css };
        else {
          // only allow unique users in a given group (compare ordinal name)
          const uniqueUsers = g.users?.filter(
            (x, i, s) =>
              s.findIndex((u) => u.toUpperCase() === x.toUpperCase()) === i
          );
          if (uniqueUsers) g.users = uniqueUsers;
          // a group name is required to accumulate
          if (g.name) acc.push(g);
        }
        return acc;
      }, builtinGroups)
    : [];
};

export const mergeSettings = async (newSettings: MigratedSettings) => {
  // pass in an object named for the settings options we want to mutate
  // to rename if found, pass: { option_name: [{ old: "...", new: "..." }] }
  // to rename a top-level key, pass: { key: [{ old: "...", new: "..." }] }
  // to remove a top-level key, pass: { key: [{ old: "...", new: null }] }
  // to remove in a list if found, pass: { option_name: [{ old: "...", new: null }] }
  // to remove if found, pass: { option_name: null }
  const settings = (await getSettings()) as Record<string, any>;
  for (const [key, val] of Object.entries(newSettings))
    if (arrHas(val))
      for (const v of val) {
        const _oldVal = settings[key];
        const _oldTopVal = settings[v.old];
        if (key !== "key") {
          const foundIdx = (_oldVal as string[]).findIndex((x) => x === v.old);
          // mutate array and leave no duplicate options/sub-options
          if (foundIdx > -1 && v.new) {
            (_oldVal as string[])[foundIdx] = v.new;
            settings[key] = (_oldVal as string[]).filter(
              (x, i, s) => s.indexOf(x) === i
            );
          } else if (foundIdx > -1 && v.new === null)
            settings[key] = (_oldVal as string[])
              .splice(foundIdx)
              .filter((x, i, s) => s.indexOf(x) === i);
        } else if (key === "key" && _oldTopVal) {
          delete settings[v.old];
          settings[v.new] = _oldTopVal;
        } else if (key === "key" && settings[v.old] && v.new === null)
          delete settings[v.old];
      }
    else if (val === null && key && settings[key]) delete settings[key];

  return settings;
};

export const migrateSettings = async () => {
  const legacy_settings = await getSettingsLegacy();
  let current_version = getManifestVersion();
  let last_version = (await getSettingsVersion()) || current_version;
  let migrated = false;
  if (legacy_settings?.["version"] <= 1.63) {
    // quick reload of default settings from nuStorage
    await resetSettings().then(getSettings);
    // preserve previous convertible filters and notifications state
    const prevFilters = legacy_settings["user_filters"] || null;
    const prevNotifyUID = legacy_settings["notificationuid"] || null;
    const prevNotifyState = legacy_settings["notifications"] || null;
    if (prevFilters) await setSetting("user_filters", prevFilters);
    if (prevNotifyUID && prevNotifyState)
      await setEnabled("enable_notifications");
    window.localStorage.clear();
    migrated = true;
  }
  if (last_version <= 1.68 && last_version >= 1.64) {
    // migrate pre-1.69 settings
    const settingsMutation = {
      enabled_scripts: [
        { old: "image_loader", new: "media_loader" },
        { old: "video_loader", new: "media_loader" },
        { old: "embed_socials", new: "social_loader" },
      ],
      enabled_suboptions: [
        { old: "es_show_tweet_threads", new: "sl_show_tweet_threads" },
      ],
      notificationuid: null,
    } as MigratedSettings;
    const mutatedSettings = await mergeSettings(settingsMutation);
    await setSettings(mutatedSettings);
    migrated = true;
  }
  if (last_version >= 1.69 && last_version < 1.72) {
    // migrate pre-1.72 settings
    const settingsMutation = {
      key: [{ old: "selected_tab", new: "selected_upload_tab" }],
      collapsed_threads: null,
      last_collapse_time: null,
    } as MigratedSettings;
    const mutatedSettings = await mergeSettings(settingsMutation);
    await setSettings(mutatedSettings);
    migrated = true;
  }
  if (last_version <= 1.73) {
    // make sure highlight_groups are up-to-date for 1.74
    const mutatedGroups = await mergeHighlightGroups(
      legacy_settings?.["highlight_groups"],
      DefaultSettings.highlight_groups
    );
    await setSettings({
      ...legacy_settings,
      highlight_groups: mutatedGroups,
    });
    console.log("merged highlight groups:", mutatedGroups);
    migrated = true;
  }

  // pull the latest version data after the migration
  current_version = getManifestVersion();
  last_version = (await getSettingsVersion()) || current_version;
  const imported = await getEnabledSuboption("imported");
  const show_notes = await getEnabledSuboption("show_rls_notes");
  if (imported || last_version !== current_version) {
    // reset time tracked variables when migrating from imported data
    await setSetting("new_comment_highlighter_last_id", -1);
    await setSetting("chatty_news_lastfetchtime", -1);
    await setEnabledSuboption("show_rls_notes");
    await updateSettingsVersion();
  } else await updateSettingsVersion();
  // only show release notes once after the version is updated
  if (show_notes && !imported) {
    await chrome.tabs.create({ url: "release_notes.html" });
    await removeEnabledSuboption("show_rls_notes");
  }
  await removeEnabledSuboption("imported");

  console.log("after migrateSettings:", await getSettings());
};

const mergeTransients = async (
  transientData: Settings,
  transientOpts?: TransientOpts
) => {
  const { append, exclude, defaults, overwrite } = transientOpts || {};
  const settings = await getSettings();
  let output = {} as Settings;
  if (defaults) output = { ...DefaultSettings };
  else output = { ...settings };
  if (objHas(transientData) || objHas(transientOpts))
    console.log("mergeTransients called:", transientData, transientOpts);
  return Object.keys(transientData)?.reduce((acc, k) => {
    const _inVal = transientData[k as keyof Settings];
    const _setVal = acc[k as keyof Settings];
    const _inValIsArr = Array.isArray(_inVal) && (_inVal as string[]);
    const _setIsArr = Array.isArray(_setVal) && (_setVal as string[]);
    const foundList =
      !_inValIsArr && _setIsArr && _setIsArr.find((x) => x === _inVal);
    const foundVal = _setVal === _inVal;
    // 'append' simply appends a value to an existing list (probably HighlightGroups)
    const appendedArr = append &&
      _inValIsArr &&
      _setIsArr && [..._setIsArr, ..._inValIsArr];
    // 'exclude' filters the given strings out of an option list
    const filteredArr =
      exclude &&
      _inValIsArr &&
      _setIsArr &&
      _inValIsArr.reduce((opts, s) => opts.filter((o) => o !== s), _setIsArr);
    if (appendedArr) return { ...acc, [k]: appendedArr };
    else if (filteredArr) return { ...acc, [k]: filteredArr };
    else if (!foundList && !foundVal && !overwrite && _inValIsArr)
      return { ...acc, [k]: [..._setIsArr, ..._inValIsArr] };
    else if (!foundList && !foundVal) return { ...acc, [k]: _inVal };
    return acc;
  }, output);
};
export const mergeTransientSettings = async () => {
  // process any testing related settings passed in by cypress
  try {
    const localTransientOpts = window.localStorage.getItem("transient-opts");
    const localTransientData = window.localStorage.getItem("transient-data");

    if (localTransientOpts || localTransientData)
      console.log(
        "mergeTransientSettings:",
        localTransientOpts,
        localTransientData
      );

    const transientOpts = localTransientOpts && JSON.parse(localTransientOpts);
    const transientData = localTransientData && JSON.parse(localTransientData);
    if (objHas(transientData)) {
      const merged = await mergeTransients(transientData, transientOpts);
      const newSettings = await resetSettings(merged);
      console.log("mergeTransientSettings merged:", newSettings);
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.clear();
};
