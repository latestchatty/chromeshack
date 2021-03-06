import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { classNames, getFileCount } from "../../core/common";

const ExclamationCircleIcon = ({ className, title }: { className: string; title: string }) => (
    <FontAwesomeIcon className={className} title={title} icon={faExclamationCircle} />
);

const ToggleChildren = (props: ImageUploaderComponentProps) => {
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
};

const Tab = (props: ImageUploaderComponentProps) => {
    const { id, label, selected, clickHandler } = props || {};
    const classes = classNames("tab", { active: selected }, { inactive: !selected });
    return (
        <div id={id} className={classes} onClick={clickHandler}>
            {label}
        </div>
    );
};

const DropArea = (props: ImageUploaderComponentProps) => {
    const { fcRef, multifile, fileData, formats, disabled, dispatch } = props || {};
    const showWarning = fileData.length > 1 && !multifile;
    const override = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const onDropHandler = (e: React.DragEvent<HTMLElement>) => {
        override(e);
        const data = e.dataTransfer.files;
        if (data && data.length > 0 && !disabled) dispatch({ type: "LOAD_FILES", payload: data });
    };
    const handleFileChooser = (e: React.ChangeEvent<HTMLInputElement>) => {
        const data = (e.target as HTMLInputElement).files;
        if (data?.length > 0) dispatch({ type: "LOAD_FILES", payload: data });
    };
    const onClickLabelHandler = (e: React.MouseEvent) => {
        const thisElem = e.target as HTMLSpanElement;
        const thisArea = thisElem?.closest("#dropArea") as HTMLElement;
        const chooser = thisArea?.querySelector("#fileChooser") as HTMLElement;
        if (!disabled && chooser) chooser.click();
    };
    return (
        <div
            id="dropArea"
            className={classNames({ disabled, active: fileData.length > 0 })}
            onDrop={onDropHandler}
            onDragOver={override}
            onDragEnter={override}
            onDragExit={override}
        >
            <input
                ref={fcRef}
                type="file"
                id="fileChooser"
                className="hidden"
                multiple={multifile}
                accept={formats}
                onChange={handleFileChooser}
            />
            <span onClick={onClickLabelHandler}>
                {getFileCount(fileData) || `Drop or select ${multifile ? "files" : "file"} here...`}
            </span>
            <ExclamationCircleIcon
                title="Warning: single file host - only first file will be sent!"
                className={classNames("drop__area--icon", { hidden: !showWarning })}
            />
        </div>
    );
};

const UrlInput = (props: ImageUploaderComponentProps) => {
    const { state, disabled, dispatch } = props || {};
    const [url, setUrl] = useState("");
    const useDebouncedUrl = useRef(debounce((val) => dispatch({ type: "LOAD_URL", payload: val }), 500));
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
            pattern="https?://.+?\..+?/.+"
            value={url}
            onChange={onInput}
            readOnly={disabled}
            spellCheck={false}
            required={true}
            placeholder="https://media.site/image-or-video"
        />
    );
};

const Button = (props: ImageUploaderComponentProps) => {
    const { id, disabled, clickHandler, label } = props || {};
    return (
        <button id={id} disabled={disabled} onClick={clickHandler}>
            {label}
        </button>
    );
};

const StatusLine = (props: ImageUploaderComponentProps) => {
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
};

export { StatusLine, Button, UrlInput, DropArea, Tab, ToggleChildren };
