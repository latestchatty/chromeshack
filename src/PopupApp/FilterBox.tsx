import React, { useEffect, useRef, useState } from "react";
import { arrHas, classNames } from "../core/common";
import { HighlightGroup } from "../core/settings";
import { addFilter, delFilters } from "./actions";
import type { FilterTypes } from "./index.d";
import { usePopupStore } from "./popupStore";

export const FilterBox = (props: {
    id: string;
    type: FilterTypes | "UPDATE_HIGHLIGHTGROUP";
    classes?: string;
    infolabel?: string;
    options?: string[];
    groups?: HighlightGroup[];
    groupName?: string;
}) => {
    const { id, type, classes, infolabel, options, groups, groupName } = props || {};

    const [optionVals, setOptionVals] = useState([] as string[]);
    const [textField, setTextField] = useState("");
    const [selected, setSelected] = useState([] as string[]);
    const inputRef = useRef<HTMLInputElement>(null);

    const { useStoreDispatch } = usePopupStore;
    const dispatch = useStoreDispatch();

    const selectId = `${id}_select_box`;
    const boxId = `${id}_text_box`;
    const addBtnId = `${id}_add_btn`;
    const removeBtnId = `${id}_remove_btn`;

    const handleSelectClick = (e: React.MouseEvent<HTMLSelectElement, MouseEvent>) => {
        const _this = e.target as HTMLSelectElement;
        // deselect selected options if clicking outside the list
        if (_this.selectedOptions?.length > 0) setSelected([]);
    };
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const _this = e.target as HTMLSelectElement;
        const _options = [..._this?.options]?.map((x) => x.value);
        const _selected = [..._this?.selectedOptions]?.map((x) => x.value);
        if (arrHas(_options) && _options !== optionVals) setOptionVals(_options);
        if (arrHas(_selected) && _selected !== selected) setSelected(_selected);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const _this = e.target as HTMLInputElement;
        const val = _this?.value;
        setTextField(val);
    };
    const handleFilterAddBtn = () => {
        if (textField?.length >= 2 && textField?.match(/[^\s\r\n]+/i)) {
            const trimmed = textField.trim();
            if (type !== "UPDATE_HIGHLIGHTGROUP") addFilter(options, trimmed, type, dispatch);
            else addFilter(options, trimmed, type, dispatch, groups, groupName);
            setTextField("");
        } else {
            alert("Input fields must contain 2 or more characters");
            if (inputRef.current) inputRef.current.focus();
        }
    };
    const handleEnterOnInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleFilterAddBtn();
    };
    const handleFiltersDelBtn = () => {
        if (type !== "UPDATE_HIGHLIGHTGROUP") delFilters(options, selected, type, dispatch);
        else delFilters(options, selected, type, dispatch, groups, groupName);
        setSelected([]);
    };

    useEffect(() => {
        setOptionVals(options);
    }, [options, groups, selected]);

    return (
        <div className={classNames("filter_box", classes)}>
            {infolabel && <p>{infolabel}</p>}
            <select
                id={selectId}
                name={selectId}
                className={classes}
                value={selected}
                onChange={handleSelectChange}
                onClick={handleSelectClick}
                multiple={true}
            >
                {optionVals &&
                    optionVals.map((o, i) => (
                        <option key={i} value={o}>
                            {o}
                        </option>
                    ))}
            </select>
            <div className="filter_box_inputs">
                <input
                    type="text"
                    name={boxId}
                    id={boxId}
                    value={textField}
                    onKeyUp={handleEnterOnInput}
                    onChange={handleTextChange}
                    ref={inputRef}
                />
                <button id={addBtnId} onClick={handleFilterAddBtn}>
                    Add
                </button>
                <button id={removeBtnId} onClick={handleFiltersDelBtn} disabled={!arrHas(selected)}>
                    Remove
                </button>
            </div>
        </div>
    );
};
