import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { debounce } from "ts-debounce";
import { classNames, getFileCount } from "../../core/common";

export const ToggleChildren = ({ id, childId, label, visible, clickHandler, children }) => {
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

export const Tab = ({ id, label, selected, clickHandler }) => {
    const classes = classNames("tab", { active: selected }, { inactive: !selected });
    return (
        <div id={id} className={classes} onClick={clickHandler}>
            {label}
        </div>
    );
};

export const DropArea = ({ fcRef, multifile, fileData, formats, disabled, dispatch }) => {
    const override = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const onDropHandler = (e) => {
        override(e);
        const data = e.dataTransfer.files;
        if (data && data.length > 0 && !disabled) dispatch({ type: "LOAD_FILES", payload: data });
    };
    const handleFileChooser = (e) => {
        const data = e.target.files;
        if (data && data.length > 0) dispatch({ type: "LOAD_FILES", payload: data });
    };
    const onClickLabelHandler = (e) => {
        const thisElem = e.target;
        const thisArea = thisElem && thisElem.closest("#dropArea");
        const chooser = thisArea && thisArea.querySelector("#fileChooser");
        if (!disabled) chooser && chooser.click();
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
            <span onClick={onClickLabelHandler}>{getFileCount(fileData) || "Drop or select files here..."}</span>
        </div>
    );
};

export const UrlInput = ({ state, disabled, dispatch }) => {
    const [url, setUrl] = useState("");
    const useDebouncedUrl = useRef(debounce((val) => dispatch({ type: "LOAD_URL", payload: val }), 1500));
    const onInput = (e) => {
        e.persist();
        const thisElem = e.target;
        const val = thisElem?.value;
        setUrl(val);
        // debounce the dispatcher
        useDebouncedUrl.current(val);
    };
    const classes = classNames({ hidden: disabled });
    // update our value from a parent when the external state changes
    useEffect(() => setUrl(state), [state]);
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

export const Button = ({ id, disabled, clickHandler, label }) => (
    <button id={id} disabled={disabled} onClick={clickHandler}>
        {label}
    </button>
);

export const StatusLine = ({ status, error, isPending, animationEnd }) => {
    const statusClasses = classNames({
        fadeout: !isPending,
        hidden: !(status.length > 0),
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
