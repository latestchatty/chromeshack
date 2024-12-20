import { memo, useCallback, useEffect, useState } from "react";
import { arrHas, classNames } from "../core/common/common";
import { toggleOption } from "./actions";
import { useStore } from "./popupStore";

interface OptionProps {
  key: string;
  val: EnabledOptions | EnabledBuiltinOptions | EnabledSuboptions;
  type: "SET_OPTIONS" | "SET_BUILTINS" | "SET_SUBOPTIONS";
}

const useOption = (opts: OptionProps) => {
  const { key, val, type = "SET_OPTIONS" } = opts || {};
  const state = useStore() as PopupState;
  const dispatch = state.dispatch;

  const [options, setOptions] = useState(state[key] as string[]);

  const isChecked = arrHas(options) ? !!options.find((x) => x?.toUpperCase() === val?.toUpperCase()) : false;
  const setChecked = useCallback(
    () => dispatch && toggleOption(options, val, type, dispatch),
    [options, val, type, dispatch],
  );

  useEffect(() => {
    const _options = state[key] as string[];
    setOptions(_options);
  }, [state, key, state[key]]);
  return { isChecked, setChecked };
};

const OptionButton = memo(
  (props: {
    id: string;
    classes?: string;
    label?: string;
    tooltip?: string;
    infolabel?: string;
    buttonlabel: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }) => {
    const { id, classes, label, tooltip, infolabel, buttonlabel, onClick } = props || {};

    return (
      <div className="option__btn">
        {label ? (
          <h2>
            <label htmlFor={id}>{label}</label>
          </h2>
        ) : undefined}
        {infolabel ? <p className="info">{infolabel}</p> : undefined}
        <button className={classes} id={id} title={tooltip} onClick={onClick ? onClick : undefined}>
          {buttonlabel}
        </button>
      </div>
    );
  },
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
    const { id, classes, label, optionid, indented = true, children } = props || {};
    const { isChecked, setChecked } = useOption({
      key: "suboptions",
      val: optionid,
      type: "SET_SUBOPTIONS",
    });

    return (
      <div className={classNames("suboption", classes, { indent: indented })} id={id}>
        <input type="checkbox" className="suboption" id={optionid} checked={isChecked} onChange={setChecked} />
        <label htmlFor={optionid ? optionid : undefined}>{label}</label>
        {children}
      </div>
    );
  },
);

const Option = memo(
  (props: {
    id: EnabledOptions | EnabledBuiltinOptions | EnabledSuboptions;
    label: string;
    classes?: string;
    indented?: boolean;
    descriptions?: string[];
    children?: React.ReactNode | React.ReactNode[];
    optionType?: "SET_OPTIONS" | "SET_BUILTINS";
  }) => {
    const { id, classes, label, indented = true, descriptions, children, optionType = "SET_OPTIONS" } = props || {};
    const { isChecked, setChecked } = useOption({
      key: optionType === "SET_BUILTINS" ? "builtins" : "options",
      val: id,
      type: optionType === "SET_BUILTINS" ? "SET_BUILTINS" : "SET_OPTIONS",
    });

    return (
      <div className={classNames("option", classes)}>
        <p>
          <input type="checkbox" className="script_check" id={id} checked={isChecked} onChange={setChecked} />
          <label htmlFor={id ? id : undefined}>{label}</label>
        </p>
        {descriptions?.map((d, i) => (
          <p key={i} className={classNames("info", { indent: indented })}>
            {d}
          </p>
        ))}
        {children}
      </div>
    );
  },
);
const OptionBuiltin = (props: {
  id: EnabledBuiltinOptions;
  label: string;
  indented?: boolean;
  descriptions?: string[];
  children?: React.ReactNode | React.ReactNode[];
}) => (
  <Option
    id={props.id}
    optionType={"SET_BUILTINS"}
    indented={props.indented}
    label={props.label}
    descriptions={props.descriptions}>
    {props.children != null ? props.children : null}
  </Option>
);

// Warning: OptionGroup is sensitive to memo() use!
const OptionGroup = (props: {
  label: string;
  id?: EnabledOptions | EnabledBuiltinOptions | EnabledSuboptions;
  classes?: string;
  indented?: boolean;
  infolabel?: string;
  children?: React.ReactNode | React.ReactNode[];
  optionType?: "SET_OPTIONS" | "SET_BUILTINS";
}) => {
  const { id, classes, label, indented = false, infolabel, children, optionType = "SET_OPTIONS" } = props || {};
  const { isChecked, setChecked } = useOption(
    id
      ? {
          key: "options",
          val: id,
          type: optionType === "SET_BUILTINS" ? "SET_BUILTINS" : "SET_OPTIONS",
        }
      : ({} as OptionProps),
  );

  return (
    <div className={classNames("option__group", classes)}>
      <h2>
        {!!id && <input type="checkbox" className="script_check" id={id} checked={isChecked} onChange={setChecked} />}
        <label htmlFor={id ? id : undefined}>{label}</label>
      </h2>
      {infolabel ? <p className={classNames("info", { indent: indented })}>{infolabel}</p> : undefined}
      {children}
    </div>
  );
};

export { Option, OptionBuiltin, OptionButton, Suboption, OptionGroup };
