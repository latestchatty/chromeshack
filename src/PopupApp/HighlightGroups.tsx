import React, { memo, useEffect, useState } from "react";
import { arrHas } from "../core/common/common";
import { superTrim } from "../core/common/dom";
import { highlightGroupsEqual } from "../core/settings";
import { FilterBox } from "./FilterBox";
import { addHighlightGroup, delHighlightGroup } from "./actions";
import { insertGroupCSS, randomHsl, trimName } from "./helpers";
import { useStore } from "./popupStore";

const HighlightGroup = memo((props: { name: string }) => {
  const { name } = props || {};

  const state = useStore() as PopupState;
  const dispatch = state.dispatch;

  const [localGroup, setLocalGroup] = useState<HighlightGroup>(
    state.highlightgroups?.find((g) => g.name.toUpperCase() === name.toUpperCase()),
  );
  const [nameInput, setNameInput] = useState(localGroup.name);
  const [styleInput, setStyleInput] = useState(localGroup.css);
  const [isChecked, setIsChecked] = useState(localGroup.enabled);

  const setInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const _this = e.target.nodeName === "INPUT" ? (e.target as HTMLInputElement) : (e.target as HTMLTextAreaElement);
    const fieldKey = _this?.getAttribute("data-for");
    const fieldVal = fieldKey === "enabled" ? (_this as HTMLInputElement)?.checked : _this?.value;
    if (fieldKey === "name") setNameInput(fieldVal as string);
    if (fieldKey === "css") {
      const _fieldVal = fieldVal as string;
      setStyleInput(_fieldVal);
    }
    if (fieldKey === "enabled") setIsChecked(fieldVal as boolean);
  };
  const handleDelGroup = () => {
    if (name) delHighlightGroup(state.highlightgroups, name, dispatch);
  };
  const handleSplotchClick = () => {
    let firstColor: string;
    const style = styleInput?.replace(/((?:\s*?)color:.+?;)/gim, (_, g1) => {
      // allow only two color rules, the original and our test rule
      if (!firstColor) {
        firstColor = g1;
        return g1;
      }
      return "";
    });
    const newStyle = superTrim(`${style} color: ${randomHsl()} !important;`);
    if (newStyle) setStyleInput(newStyle);
  };

  useEffect(() => {
    const _group = state.highlightgroups?.find((g) => g.name.toUpperCase() === name.toUpperCase());
    const newLocalGroup = {
      ..._group,
      name: nameInput,
      enabled: isChecked,
      css: styleInput,
    };
    if (newLocalGroup) setLocalGroup(newLocalGroup);
  }, [state.highlightgroups, name, isChecked, styleInput, nameInput]);
  useEffect(() => {
    const handler = setTimeout(() => {
      const _group = state.highlightgroups?.find((g) => g.name.toUpperCase() === name.toUpperCase());
      if (!highlightGroupsEqual(_group, localGroup))
        dispatch({
          type: "UPDATE_HIGHLIGHTGROUP",
          payload: { prevGroup: name, newGroup: localGroup },
        });
    }, 500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, localGroup, name, dispatch]);
  useEffect(() => {
    insertGroupCSS(state.highlightgroups);
  }, [state.highlightgroups]);

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
          <span id={`${trimName(nameInput)}_splotch`} title="Click to try a new color">
            Aa
          </span>
        </div>
      </div>
    </div>
  );
});

const HighlightGroups = memo(() => {
  const state = useStore() as PopupState;
  const dispatch = state.dispatch;

  const handleAddGroup = () => addHighlightGroup(state.highlightgroups, {}, dispatch);

  return (
    <div id="highlight_groups">
      {arrHas(state.highlightgroups) && state.highlightgroups?.map((g, i) => <HighlightGroup key={i} name={g.name} />)}
      <button id="add_highlight_group" onClick={handleAddGroup}>
        Add Group
      </button>
    </div>
  );
});

export { HighlightGroups };
