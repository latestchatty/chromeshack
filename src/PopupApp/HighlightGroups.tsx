/* eslint react-hooks/exhaustive-deps: 0 */
import React, { useEffect, useState } from "react";
import { arrHas, cssStrToProps, superTrim } from "../core/common";
import type { HighlightGroup as HighlightGroupType } from "../core/index.d";
import { highlightGroupsEqual } from "../core/settings";
import { addHighlightGroup, delHighlightGroup } from "./actions";
import { FilterBox } from "./FilterBox";
import { randomHsl, trimName } from "./helpers";
import type { PopupState } from "./index.d";
import { usePopupStore } from "./popupStore";

const HighlightGroup = (props: { name: string }) => {
    const { name } = props || {};

    const { useStoreState, useStoreDispatch } = usePopupStore;
    const state = useStoreState() as PopupState;
    const dispatch = useStoreDispatch();

    const [localGroup, setLocalGroup] = useState<HighlightGroupType>(
        state.highlightgroups?.find((g) => g.name.toUpperCase() === name.toUpperCase()),
    );
    const [nameInput, setNameInput] = useState(localGroup.name);
    const [styleInput, setStyleInput] = useState(localGroup.css);
    const [isChecked, setIsChecked] = useState(localGroup.enabled);
    const [styleOutput, setStyleOutput] = useState(cssStrToProps(styleInput) as React.CSSProperties);

    const setInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const _this =
            e.target.nodeName === "INPUT" ? (e.target as HTMLInputElement) : (e.target as HTMLTextAreaElement);
        const fieldKey = _this?.getAttribute("data-for");
        const fieldVal = fieldKey === "enabled" ? (_this as HTMLInputElement)?.checked : _this?.value;
        if (fieldKey === "name") setNameInput(fieldVal as string);
        if (fieldKey === "css") {
            const _fieldVal = fieldVal as string;
            const cssProps = cssStrToProps(_fieldVal);
            setStyleInput(_fieldVal);
            setStyleOutput(cssProps);
        }
        if (fieldKey === "enabled") setIsChecked(fieldVal as boolean);
    };
    const handleDelGroup = () => {
        if (name) delHighlightGroup(state.highlightgroups, name, dispatch);
    };
    const handleSplotchClick = () => {
        let firstColor: string;
        const style = styleInput?.replace(/((?:\s*?)color:.+?;)/gim, (m, g1) => {
            // allow only two color rules, the original and our test rule
            if (!firstColor) {
                firstColor = g1;
                return g1;
            } else return "";
        });
        const newStyle = superTrim(`${style} color: ${randomHsl()} !important;`);
        const cssProps = cssStrToProps(newStyle);
        if (newStyle) {
            setStyleInput(newStyle);
            setStyleOutput(cssProps);
        }
    };

    useEffect(() => {
        const _group = state.highlightgroups?.find((g) => g.name.toUpperCase() === name.toUpperCase());
        const newLocalGroup = { ..._group, name: nameInput, enabled: isChecked, css: styleInput };
        if (newLocalGroup) setLocalGroup(newLocalGroup);
    }, [state.highlightgroups, name, isChecked, styleInput, nameInput]);
    useEffect(() => {
        const handler = setTimeout(() => {
            const _group = state.highlightgroups?.find((g) => g.name.toUpperCase() === name.toUpperCase());
            if (!highlightGroupsEqual(_group, localGroup))
                dispatch({ type: "UPDATE_HIGHLIGHTGROUP", payload: { prevGroup: name, newGroup: localGroup } });
        }, 500);
        return () => clearTimeout(handler);
    }, [localGroup, name, dispatch]);

    return (
        <div id="highlight_group">
            <div className="group_header">
                <input type="checkbox" data-for="enabled" checked={isChecked} onChange={setInput} />
                <input
                    type="text"
                    data-for="name"
                    className="group_label"
                    value={nameInput}
                    onChange={setInput}
                    readOnly={localGroup.built_in}
                />
                <button id="remove_group" onClick={handleDelGroup}>
                    Remove
                </button>
            </div>
            {!localGroup.built_in && (
                <FilterBox
                    id={`${trimName(nameInput)}_list`}
                    type="UPDATE_HIGHLIGHTGROUP"
                    options={localGroup.users}
                    groups={state.highlightgroups}
                    groupName={localGroup.name}
                />
            )}
            <div className="group_css">
                <textarea
                    id={`${trimName(nameInput)}_css`}
                    data-for="css"
                    spellCheck={false}
                    value={styleInput}
                    onChange={setInput}
                />
                <div className="test_css" title="Click to try a new style" onClick={handleSplotchClick}>
                    <span id={`${trimName(nameInput)}_splotch`} style={styleOutput} title="Click to try a new color">
                        Aa
                    </span>
                </div>
            </div>
        </div>
    );
};

const HighlightGroups = () => {
    const { useStoreState, useStoreDispatch } = usePopupStore;
    const state = useStoreState() as PopupState;
    const dispatch = useStoreDispatch();

    const handleAddGroup = () => addHighlightGroup(state.highlightgroups, {}, dispatch);

    return (
        <div id="highlight_groups">
            {arrHas(state.highlightgroups) &&
                state.highlightgroups?.map((g, i) => <HighlightGroup key={i} name={g.name} />)}
            <button id="add_highlight_group" onClick={handleAddGroup}>
                Add Group
            </button>
        </div>
    );
};

export { HighlightGroups };
