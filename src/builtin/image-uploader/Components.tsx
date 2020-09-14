import React, { useState, useRef, useEffect } from "react";
import { debounce } from "ts-debounce";
import { classNames, getFileCount } from "../../core/common";
import { UploaderState, UploaderAction } from "./uploaderStore";

interface ImageUploaderComponentProps {
    id?: string;
    childId?: string;
    label?: string;
    visible?: boolean;
    selected?: boolean;
    clickHandler?: any;
    children?: React.ReactNode | React.ReactNode[];
    fcRef?: React.Ref<HTMLInputElement>;
    multifile?: boolean;
    fileData?: File[];
    formats?: string;
    disabled?: boolean;
    dispatch?: React.Dispatch<UploaderAction>;
    state?: UploaderState | string;
    status?: string;
    error?: any;
    isPending?: boolean;
    animationEnd?: any;
}
export const ToggleChildren = (props: ImageUploaderComponentProps) => {
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

export const Tab = (props: ImageUploaderComponentProps) => {
    const { id, label, selected, clickHandler } = props || {};
    const classes = classNames("tab", { active: selected }, { inactive: !selected });
    return (
        <div id={id} className={classes} onClick={clickHandler}>
            {label}
        </div>
    );
};

export const DropArea = (props: ImageUploaderComponentProps) => {
    const { fcRef, multifile, fileData, formats, disabled, dispatch } = props || {};
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
    const classes = classNames({ disabled }, { active: fileData.length > 0 });
    return (
        <div
            id="dropArea"
            className={classes}
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
        </div>
    );
};

export const UrlInput = (props: ImageUploaderComponentProps) => {
    const { state, disabled, dispatch } = props || {};
    const [url, setUrl] = useState("");
    const useDebouncedUrl = useRef(debounce((val) => dispatch({ type: "LOAD_URL", payload: val }), 1500));
    const onInput = (e: React.ChangeEvent) => {
        e.persist();
        const this_node = e?.target as HTMLInputElement;
        const val = this_node?.value;
        setUrl(val);
        // debounce the dispatcher
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

export const Button = (props: ImageUploaderComponentProps) => {
    const { id, disabled, clickHandler, label } = props || {};
    return (
        <button id={id} disabled={disabled} onClick={clickHandler}>
            {label}
        </button>
    );
};

export const StatusLine = (props: ImageUploaderComponentProps) => {
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
