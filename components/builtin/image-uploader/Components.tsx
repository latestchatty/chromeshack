import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { classNames, getFileCount } from "../../core/common/common";

const ExclamationCircleIcon = memo(({ className, title }: { className: string; title: string }) => (
  <FontAwesomeIcon className={className} title={title} icon={faExclamationCircle} />
));

export const ToggleChildren = memo((props: ImageUploaderComponentProps) => {
  const { id, childId, label, visible, clickHandler, children } = props || {};
  const childClasses = classNames({ hidden: !visible });
  return (
    <div id={id}>
      <span id="toggleLabel" onClick={clickHandler}>
        {label}
      </span>
      <div id={childId} className={childClasses}>
        {children}
      </div>
    </div>
  );
});

export const Tab = memo((props: ImageUploaderComponentProps) => {
  const { id, label, selected, clickHandler } = props || {};
  const classes = classNames("tab", { active: selected }, { inactive: !selected });
  return (
    <div id={id} className={classes} onClick={clickHandler}>
      {label}
    </div>
  );
});

export const DropArea = memo((props: ImageUploaderComponentProps) => {
  const { fcRef, multifile, fileData, formats, disabled, dispatch } = props || {};
  const showWarning = fileData?.length && fileData.length > 1 && !multifile;

  const override = useCallback((e: React.DragEvent | React.ChangeEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleFileChooser = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
      override(e);
      const dropData = (e as React.DragEvent<HTMLElement>)?.dataTransfer?.files;
      const chooserData = (e as React.ChangeEvent<HTMLInputElement>)?.target?.files;
      const data = dropData ?? chooserData;
      if (data?.length > 0 && !disabled && dispatch) dispatch({ type: "LOAD_FILES", payload: data });
    },
    [override, disabled, dispatch],
  );

  return (
    <div
      id="dropArea"
      className={classNames({ disabled, active: fileData?.length })}
      onDrop={handleFileChooser}
      onDragOver={override}
      onDragEnter={override}
      onDragExit={override}>
      <label id="fileChooserLabel" htmlFor="fileChooser">
        {getFileCount(fileData as File[]) || `Drop or select ${multifile ? "files" : "file"} here...`}
        <input
          ref={fcRef}
          type="file"
          id="fileChooser"
          multiple={multifile}
          accept={formats}
          onChange={handleFileChooser}
        />
      </label>
      <ExclamationCircleIcon
        title="Warning: single file host - only first file will be sent!"
        className={classNames("drop__area--icon", { hidden: !showWarning })}
      />
    </div>
  );
});

export const UrlInput = memo((props: ImageUploaderComponentProps) => {
  const { state, disabled, dispatch } = props || {};
  const [url, setUrl] = useState("");
  const urlValidatePattern = "https?://.+?\\..+?/.+";
  const urlValidateRegExp = new RegExp(urlValidatePattern);

  const useDebouncedUrl = useRef(
    debounce((val: string) => {
      const match = val?.match(urlValidateRegExp);
      if (match && dispatch) dispatch({ type: "LOAD_URL", payload: val });
      else if (dispatch) dispatch({ type: "LOAD_INVALID_URL" });
    }, 500),
  );
  const onInput = (e: React.ChangeEvent) => {
    const _this = e?.target as HTMLInputElement;
    const val = _this?.value;
    setUrl(val);
    useDebouncedUrl.current(val);
  };
  const classes = classNames({ hidden: disabled });
  // update our value from a parent when the external state changes
  useEffect(() => setUrl(state as string), [state]);
  return (
    <input
      type="url"
      id="urlinput"
      className={classes}
      minLength={7}
      maxLength={2048}
      pattern={urlValidatePattern}
      value={url}
      onChange={onInput}
      readOnly={disabled}
      spellCheck={false}
      required={true}
      placeholder="https://media.site/image-or-video"
    />
  );
});

export const Button = memo((props: ImageUploaderComponentProps) => {
  const { id, disabled, clickHandler, label } = props || {};
  return (
    <button id={id} disabled={disabled} onClick={clickHandler}>
      {label}
    </button>
  );
});

export const StatusLine = memo((props: ImageUploaderComponentProps) => {
  const { status, error, isPending, animationEnd } = props || {};
  const statusClasses = classNames({
    fadeout: !isPending,
    hidden: !status,
  });
  const msgClasses = classNames("truncate", { error });
  return (
    <div id="status" className={statusClasses} onAnimationEnd={animationEnd}>
      <span id="statuslabel" className={error && "error"}>
        {error ? "Failure:" : "Status:"}
      </span>
      <span id="statusmsg" className={msgClasses} title={status}>
        {status}
      </span>
    </div>
  );
});
