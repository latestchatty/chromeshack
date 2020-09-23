import React, { useCallback, useRef, useState } from "react";
import { superTrim } from "../core/common";
import {
    DefaultSettings,
    getSettings,
    HighlightGroup,
    mergeHighlightGroups,
    mergeUserFilters,
    migrateSettings,
    setEnabledSuboption,
    setSettings,
} from "../core/settings";
import { getState } from "./actions";
import { copyToClipboard, objConditionalFilter } from "./helpers";
import { usePopupStore } from "./popupStore";

export const ImportExport = () => {
    const { useStoreDispatch } = usePopupStore;
    const dispatch = useStoreDispatch();

    const [fieldBox, setFieldBox] = useState("");
    const [importing, setImporting] = useState(false);
    const textRef = useRef<HTMLTextAreaElement>();

    const validateImport = (value: string) => {
        const field_limit = 5 * 1000 * 1000;
        try {
            (async () => {
                const trimmed = superTrim(value);
                const parsed = JSON.parse(trimmed);
                if (parsed?.length > field_limit) {
                    const _truncated = value.substring(0, field_limit);
                    alert("Warning! Settings input must be less than 5 MiB in size!");
                    setFieldBox(_truncated);
                } else if (parsed) {
                    // spread merged settings, highlight groups, and user filters into default settings
                    const mergedGroups = await mergeHighlightGroups(
                        parsed.highlight_groups,
                        DefaultSettings.highlight_groups,
                    );
                    const combinedSettings = {
                        ...DefaultSettings,
                        ...{
                            ...parsed,
                            highlight_groups: mergedGroups,
                            user_filters: await mergeUserFilters(parsed.user_filters),
                        },
                    };
                    await setSettings(combinedSettings);
                    await setEnabledSuboption("imported");
                    await migrateSettings();
                    const freshState = await getState();
                    // overwrite our state from the local settings store
                    dispatch({ type: "INIT", payload: freshState });
                    // reset our form state
                    setFieldBox("");
                    setImporting(false);
                    alert("Successfully imported settings");
                }
            })();
        } catch (e) {
            console.error("Something went wrong when validating settings import:", value);
        }
    };
    const validateExport = useCallback(() => {
        try {
            (async () => {
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
                const result = JSON.stringify(mutated, null, 2);
                setFieldBox(result);
                if (textRef.current && copyToClipboard(textRef.current, result))
                    alert("Exported settings to clipboard");
            })();
        } catch (e) {
            console.error("Something went wrong when validating export:", e);
        }
    }, [textRef]);

    const handleImportExportBtn = () => {
        if (importing) validateImport(fieldBox);
        else validateExport();
    };
    const handleImportExportField = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const _this = e.target as HTMLTextAreaElement;
        if (_this.value.length === 0) setImporting(false);
        else setImporting(true);
        setFieldBox(_this.value);
    };

    return (
        <>
            <div className="import_export_area">
                <textarea
                    id="import_export_field"
                    placeholder="Paste a settings string here for import or click Export..."
                    value={fieldBox}
                    onChange={handleImportExportField}
                    ref={textRef}
                ></textarea>
            </div>
            <button id="import_export_btn" onClick={handleImportExportBtn}>
                {importing ? "Import" : "Export to clipboard"}
            </button>
        </>
    );
};
