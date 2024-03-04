import { memo, useEffect, useMemo, useRef, useState } from "react";
import { classNames } from "../core/common/common";
import { addFilter, delFilters } from "./actions";
import { useStore } from "./popupStore";

const FilterBox = memo(
  (props: {
    id: string;
    type: FilterTypes | "UPDATE_HIGHLIGHTGROUP";
    classes?: string;
    infolabel?: string;
    options?: string[];
    groups?: HighlightGroup[];
    groupName?: string;
    allowTrailingSpace?: boolean;
  }) => {
    const { id, type, classes, infolabel, options, groups, groupName, allowTrailingSpace = false } = props || {};

    const [optionVals, setOptionVals] = useState([] as string[]);
    const [textField, setTextField] = useState("");
    const [selected, setSelected] = useState([] as string[]);
    const inputRef = useRef<HTMLInputElement>(null);

    const state = useStore() as PopupState;
    const dispatch = state.dispatch;

    const selectId = useMemo(() => `${id}_select_box`, [id]);
    const boxId = useMemo(() => `${id}_text_box`, [id]);
    const addBtnId = useMemo(() => `${id}_add_btn`, [id]);
    const removeBtnId = useMemo(() => `${id}_remove_btn`, [id]);

    const handleSelectClick = (e: React.MouseEvent<HTMLSelectElement, MouseEvent>) => {
      const _this = e.target as HTMLSelectElement;
      // deselect selected options if clicking outside the list
      if (_this.selectedOptions?.length > 0) setSelected([]);
    };
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const _this = e.target as HTMLSelectElement;
      const _options = [...(_this?.options ?? [])]?.map((x) => x.value);
      const _selected = [...(_this?.selectedOptions ?? [])]?.map((x) => x?.value);
      if (_options?.length && _options !== optionVals) setOptionVals(_options);
      if (_selected?.length && _selected !== selected) setSelected(_selected);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const _this = e.target as HTMLInputElement;
      const val = _this?.value;
      setTextField(val);
    };
    const handleFilterAddBtn = () => {
      if (textField?.length >= 2 && textField?.match(/[^\h\r\n]+/i)) {
        // allow a single space before/after if requested
        const trimmed = allowTrailingSpace ? textField.replace(/\h\h+/, " ") : textField.trim();
        if (type !== "UPDATE_HIGHLIGHTGROUP" && options && dispatch) addFilter(options, trimmed, type, dispatch);
        else if (options && dispatch) addFilter(options, trimmed, type, dispatch, groups, groupName);
        setTextField("");
      } else {
        alert("Input fields must contain 2 or more characters");
        if (inputRef.current) inputRef.current.focus();
      }
    };
    const handleFiltersDelBtn = () => {
      if (type !== "UPDATE_HIGHLIGHTGROUP" && options && dispatch) delFilters(options, selected, type, dispatch);
      else if (options && dispatch) delFilters(options, selected, type, dispatch, groups, groupName);
      setSelected([]);
    };
    const handleEnterOnInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleFilterAddBtn();
    };
    const handleDelOnSelect = (e: React.KeyboardEvent<HTMLSelectElement>) => {
      if (e.key === "Delete" || e.key === "Backspace") handleFiltersDelBtn();
    };

    useEffect(() => {
      if (options) setOptionVals(options);
    }, [options]);

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
          onKeyUp={handleDelOnSelect}
          multiple={true}>
          {optionVals?.map((o, i) => {
            const innerText = o.replace(/[\s]+/gm, "&nbsp;");
            // force options to show trailing spaces if present in state
            return <option key={i} value={o} dangerouslySetInnerHTML={{ __html: innerText }} />;
          })}
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
          <button id={removeBtnId} onClick={handleFiltersDelBtn} disabled={!selected?.length}>
            Remove
          </button>
        </div>
      </div>
    );
  }
);

export { FilterBox };
