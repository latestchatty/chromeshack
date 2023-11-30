import React, { memo, useCallback, useEffect, useState } from "react";
import { arrHas, classNames } from "../core/common/common";
import { toggleOption } from "./actions";
import { usePopupStore } from "./popupStore";

const useOption = (opts: {
  key: string;
  val: EnabledOptions | EnabledSuboptions;
  type: OptionsTypes;
}) => {
  const { key, val, type } = opts || {};
  const { useStoreState, useStoreDispatch } = usePopupStore;
  const state = useStoreState() as PopupState;
  const dispatch = useStoreDispatch();

  const [options, setOptions] = useState(state[key] as string[]);

  const isChecked = arrHas(options)
    ? !!options.find((x) => x?.toUpperCase() === val?.toUpperCase())
    : false;
  const setChecked = useCallback(
    () => toggleOption(options, val, type, dispatch),
    [options, val, type, dispatch]
  );

  useEffect(() => {
    const _options = state[key] as string[];
    setOptions(_options);
  }, [state, key]);
  return { isChecked, setChecked };
};

const OptionButton = memo(
  (props: {
    id: string;
    classes?: string;
    label?: string;
    infolabel?: string;
    buttonlabel: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }) => {
    const { id, classes, label, infolabel, buttonlabel, onClick } = props || {};

    return (
      <div className="option__btn">
        {label ? (
          <h2>
            <label>{label}</label>
          </h2>
        ) : undefined}
        {infolabel ? <p className="info">{infolabel}</p> : undefined}
        <button
          className={classes}
          id={id}
          onClick={onClick ? onClick : undefined}
        >
          {buttonlabel}
        </button>
      </div>
    );
  }
);

const Suboption = memo(
  (props: {
    label: string;
    optionid: EnabledSuboptions;
    id?: string;
    classes?: string;
    indented?: boolean;
    children?: React.ReactNode | React.ReactNode[];
  }) => {
    const {
      id,
      classes,
      label,
      optionid,
      indented = true,
      children,
    } = props || {};
    const { isChecked, setChecked } = useOption({
      key: "suboptions",
      val: optionid,
      type: "SET_SUBOPTIONS",
    });

    return (
      <div
        className={classNames("suboption", classes, { indent: indented })}
        id={id}
      >
        <input
          type="checkbox"
          className="suboption"
          id={optionid}
          checked={isChecked}
          onChange={setChecked}
        />
        <label htmlFor={optionid ? optionid : undefined}>{label}</label>
        {children}
      </div>
    );
  }
);

const Option = memo(
  (props: {
    id: EnabledOptions | EnabledSuboptions;
    label: string;
    classes?: string;
    indented?: boolean;
    descriptions?: string[];
    children?: React.ReactNode | React.ReactNode[];
  }) => {
    const {
      id,
      classes,
      label,
      indented = true,
      descriptions,
      children,
    } = props || {};
    const { isChecked, setChecked } = useOption({
      key: "options",
      val: id,
      type: "SET_OPTIONS",
    });

    return (
      <div className={classNames("option", classes)}>
        <p>
          <input
            type="checkbox"
            className="script_check"
            id={id}
            checked={isChecked}
            onChange={setChecked}
          />
          <label htmlFor={id ? id : undefined}>{label}</label>
        </p>
        {descriptions &&
          descriptions.map((d, i) => (
            <p key={i} className={classNames("info", { indent: indented })}>
              {d}
            </p>
          ))}
        {children}
      </div>
    );
  }
);

const OptionGroup = (props: {
  label: string;
  id?: EnabledOptions | EnabledSuboptions;
  classes?: string;
  indented?: boolean;
  infolabel?: string;
  children?: React.ReactNode | React.ReactNode[];
}) => {
  const {
    id,
    classes,
    label,
    indented = false,
    infolabel,
    children,
  } = props || {};
  const { isChecked, setChecked } = useOption({
    key: "options",
    val: id,
    type: "SET_OPTIONS",
  });

  return (
    <div className={classNames("option__group", classes)}>
      <h2>
        {!!id && (
          <input
            type="checkbox"
            className="script_check"
            id={id}
            checked={isChecked}
            onChange={setChecked}
          />
        )}
        <label htmlFor={id ? id : undefined}>{label}</label>
      </h2>
      {infolabel ? (
        <p className={classNames("info", { indent: indented })}>{infolabel}</p>
      ) : undefined}
      {children}
    </div>
  );
};

export { Option, OptionButton, Suboption, OptionGroup };
