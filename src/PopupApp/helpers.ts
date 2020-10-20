import { superTrim } from "../core/common";
import type { HighlightGroup, Settings } from "../core/index.d";
import {
    getSettings,
    mergeHighlightGroups,
    mergeUserFilters,
    migrateSettings,
    setEnabledSuboption,
    setSettings,
} from "../core/settings";
import { DefaultSettings } from "../core/default_settings";

export const getRandomNum = (min: number, max: number, precision?: number) =>
    parseFloat((Math.random() * (max - min) + min).toPrecision(precision ? precision : 1));

// https://stackoverflow.com/a/25873123
export const randomHsl = () => `hsla(${getRandomNum(0, 360)}, ${getRandomNum(25, 100)}%, ${getRandomNum(35, 60)}%, 1)`;

export const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (Math.ceil(max) - Math.floor(min))) + Math.ceil(min);

export const trimName = (name: string) =>
    name
        .trim()
        .replace(/[\W\s]+/g, "")
        .toLowerCase();

export const cssStrToProps = (css: string): Record<any, string> => {
    if (!css || typeof css !== "string") return {};
    let styleProps = {};
    const rules = css.split(";");
    if (rules)
        rules.map((r, _, arr) => {
            let [key, val] = r?.split(":");
            key = key && (key.trim() as string);
            val = val && (val.trim() as string);
            // if we already have this key then replace it
            const keyIdx = arr.findIndex((i) => i === key);
            if (keyIdx > -1) arr.splice(keyIdx);
            const _key = key?.replace(/-[a-z]/g, (m) => m[1].toUpperCase()) || key;
            const _val = val?.replace(/ !important/g, "") || val;
            if (_key && _val) styleProps = { ...styleProps, [_key]: _val };
        });
    return styleProps;
};

export const objConditionalFilter = (disallowed: string[], obj: Record<string, any>) => {
    return Object.keys(obj)
        .filter((k) => !disallowed.includes(k))
        .reduce((o, k) => {
            return { ...o, [k]: obj[k] };
        }, {});
};

export const copyToClipboard = (textArea: HTMLTextAreaElement, exportable: string) => {
    const _textArea = textArea?.nodeName === "TEXTAREA" ? (textArea as HTMLTextAreaElement) : null;
    if (_textArea && exportable?.length > 0) {
        _textArea.select();
        document.execCommand("copy");
        return true;
    } else return false;
};

export const importSettings = async (settingsJSON: string) => {
    const field_limit = 5 * 1000 * 1000;
    try {
        const trimmed = superTrim(settingsJSON);
        const parsed = JSON.parse(trimmed);
        if (parsed?.length > field_limit) {
            const _truncated = settingsJSON.substring(0, field_limit);
            alert("Warning! Settings input must be less than 5 MiB in size!");
            return _truncated;
        } else if (parsed) {
            // spread merged settings, highlight groups, and user filters into default settings
            const mergedGroups = await mergeHighlightGroups(parsed.highlight_groups, DefaultSettings.highlight_groups);
            const combinedSettings = {
                ...DefaultSettings,
                ...{
                    ...parsed,
                    highlight_groups: mergedGroups,
                    user_filters: await mergeUserFilters(parsed.user_filters),
                },
            } as Settings;
            await setSettings(combinedSettings);
            await setEnabledSuboption("imported");
            await migrateSettings();
            return null;
        }
    } catch (e) {
        console.error("Something went wrong when validating settings import:", e);
    }
};

export const exportSettings = async () => {
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
    // leave out users array from builtin groups to save space
    const exportedGroups = settings.highlight_groups.reduce((acc, g) => {
        if (g.built_in) acc.push({ built_in: g.built_in, enabled: g.enabled, name: g.name, css: g.css });
        else if (g.name) acc.push(g);
        return acc;
    }, [] as HighlightGroup[]);
    const allowedSettings = objConditionalFilter(disallowed, settings);
    const allowedSuboptions = disallowedOptions.reduce((acc, so) => {
        const foundIdx = acc.findIndex((x) => x.toUpperCase() === so.toUpperCase());
        if (foundIdx !== -1) acc.splice(foundIdx);
        return acc;
    }, settings.enabled_suboptions as string[]);
    const mutated = {
        ...allowedSettings,
        enabled_suboptions: allowedSuboptions,
        highlight_groups: exportedGroups,
    };
    return JSON.stringify(mutated, null, 2);
};
