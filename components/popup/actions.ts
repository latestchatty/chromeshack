import { getSettings, setSettings } from "../core/settings";
import { getRandomInt, randomHsl } from "./helpers";

/*
 * IMPORTANT: ALWAYS RETURN GET/SET DATA FROM SETTINGS STORAGE - NOT STATE STORE!
 */

export const getState = async () => {
  // pull state from local settings store into reducer schema
  const _settings = (await getSettings()) as Settings;
  const options = _settings.enabled_scripts || [];
  const builtins = _settings.enabled_builtins || [];
  const suboptions = _settings.enabled_suboptions || [];
  const notifications = _settings.notifications || [];
  const filters = _settings.user_filters || [];
  const highlightgroups = _settings.highlight_groups || [];
  return {
    options,
    builtins,
    suboptions,
    notifications,
    filters,
    highlightgroups,
  } as PopupState;
};
export const setSettingsState = async (localState: PopupState) => {
  // push reducer schema into local settings store returning the new state
  const { options, builtins, suboptions, notifications, filters, highlightgroups } = localState || {};
  const settings = await getSettings();
  const newState = {
    ...settings,
    enabled_scripts: options,
    enabled_builtins: builtins,
    enabled_suboptions: suboptions,
    user_filters: filters,
    highlight_groups: highlightgroups,
    notifications,
  } as Settings;
  await setSettings(newState);
  return newState;
};

export const toggleOption = (
  options: string[],
  val: string,
  type: OptionsTypes,
  dispatch: (action: PopupAction) => void
) => {
  // works with enabled_scripts and enabled_suboptions
  const foundIdx = options?.findIndex((o) => o?.toUpperCase() === val?.toUpperCase());
  const filtered = options?.filter((o) => o.toUpperCase() !== val.toUpperCase());
  // read our val if it didn't exist previously (toggling it)
  if (foundIdx === -1) filtered.push(val);
  dispatch({ type, payload: filtered as EnabledOptions[] | EnabledBuiltinOptions[] | EnabledSuboptions[] });
  return filtered;
};

export const addFilter = (
  filters: string[],
  val: string,
  type: FilterTypes | "UPDATE_HIGHLIGHTGROUP",
  dispatch: (action: PopupAction) => void,
  groups?: HighlightGroup[],
  groupName?: string
) => {
  const foundIdx = filters?.findIndex((f) => f.trim().toUpperCase() === val.trim().toUpperCase());
  if (type !== "UPDATE_HIGHLIGHTGROUP" && foundIdx === -1) dispatch({ type, payload: [...filters, val] });
  else if (foundIdx === -1) {
    const _type = type as "UPDATE_HIGHLIGHTGROUP";
    let group = {
      ...groups?.find((g) => g.name?.toUpperCase() === groupName?.toUpperCase()),
    };
    const _filters = group?.users ? [...group.users, val] : [];
    group = { ...group, users: _filters };
    if (group) dispatch({ type: _type, payload: { newGroup: group } });
  }
};
export const delFilters = (
  filters: string[],
  options: string[],
  type: FilterTypes | "UPDATE_HIGHLIGHTGROUP",
  dispatch: (action: PopupAction) => void,
  groups?: HighlightGroup[],
  groupName?: string
) => {
  if (type !== "UPDATE_HIGHLIGHTGROUP")
    dispatch({
      type,
      payload: options.reduce(
        (acc, o) => acc.filter((f) => f.trim().toUpperCase() !== o.trim().toUpperCase()),
        filters
      ),
    });
  else {
    let group = {
      ...groups?.find((g) => g.name?.toUpperCase() === groupName?.toUpperCase()),
    };
    const _filters = options.reduce((acc, o) => acc.filter((f) => f.toUpperCase() !== o.toUpperCase()), filters);
    group = { ...group, users: _filters };
    if (group) dispatch({ type, payload: { newGroup: group } });
  }
};

const newHighlightGroup = (name?: string, css?: string, username?: string) => {
  // return a new group with a random color as its default css
  return {
    enabled: true,
    name: name?.length ? name : `New Group ${getRandomInt(1, 999999)}`,
    css: css?.length ? css : `color: ${randomHsl()} !important;`,
    users: username?.length ? [username] : [],
    builtin: false,
  } as HighlightGroup;
};
export const addHighlightGroup = (
  groups: HighlightGroup[],
  group: { name?: string; css?: string; username?: string },
  dispatch: (action: PopupAction) => void
) => {
  const { name, css, username } = group || {};
  const newGroup = newHighlightGroup(name, css, username);
  const newGroups = [...groups, newGroup];
  dispatch({ type: "SET_HIGHLIGHTGROUPS", payload: newGroups });
};
export const delHighlightGroup = (
  groups: HighlightGroup[],
  groupName: string,
  dispatch: (action: PopupAction) => void
) => {
  const newGroups = groups.filter((g) => g.name?.toUpperCase() !== groupName.toUpperCase());
  dispatch({ type: "SET_HIGHLIGHTGROUPS", payload: newGroups });
};
