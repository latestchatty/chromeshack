import React, { useRef, useEffect } from "react";

import useUploaderStore, { UploaderState } from "./uploaderStore";
import { ToggleChildren, Tab, DropArea, UrlInput, Button, StatusLine } from "./Components";

import handleImgurUpload from "../../core/api/imgur";
import handleGfycatUpload from "../../core/api/gfycat";
import handleChattypicsUpload from "../../core/api/chattypics";
import { arrHas, appendLinksToField } from "../../core/common";

export type UploadData = string[] | File[];
interface ImageUploaderAppProps {
    parentRef: HTMLElement;
}
const ImageUploaderApp = (props: ImageUploaderAppProps) => {
    const { useStoreState: useUploaderState, useStoreDispatch: useUploaderDispatch } = useUploaderStore;
    const state = useUploaderState() as UploaderState;
    const dispatch = useUploaderDispatch();
    const fileChooserRef = useRef(null);

    const onClickToggle = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        dispatch({ type: "TOGGLE_UPLOADER" });
    };
    const onClickTab = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        const this_node = e.target as HTMLDivElement;
        const thisTab = this_node?.id;
        if (thisTab !== state.selectedTab) {
            dispatch({ type: "CHANGE_TAB", payload: thisTab });
            dispatch({ type: `${thisTab.toUpperCase()}_LOAD` });
        }
    };
    const onClickUploadBtn = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        if (!(e?.target as HTMLButtonElement).disabled) {
            const { fileData, urlData, selectedTab, urlDisabled, filesDisabled } = state;
            const data = !urlDisabled ? [urlData] : !filesDisabled ? fileData : [];
            if (selectedTab === "imgurTab") handleImgurUpload(data, dispatch);
            else if (selectedTab === "gfycatTab") handleGfycatUpload(data, dispatch);
            else if (selectedTab === "chattypicsTab") handleChattypicsUpload(data as File[], dispatch);
        }
    };
    const onClickCancelBtn = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        const thisTab = state.selectedTab;
        dispatch({ type: "UPLOAD_CANCEL" });
        dispatch({ type: `${thisTab.toUpperCase()}_LOAD` });
        fileChooserRef.current.value = null;
    };
    /// hide the statusline once the transition animation ends
    const onStatusAnimEnd = () => dispatch({ type: "UPDATE_STATUS", payload: "" });

    useEffect(() => {
        /// update the reply box with links when data is returned from the server
        const thisElem = props.parentRef;
        const replyField = thisElem?.querySelector("#frm_body") as HTMLInputElement;
        if (arrHas(state?.response) && replyField) {
            appendLinksToField(replyField, state.response);
            dispatch({ type: "UPLOAD_CANCEL" }); // reset UI
        }
    }, [state.response]);

    /// tabs are defined by id and label
    const tabs = [
        { id: "imgurTab", label: "Imgur" },
        { id: "gfycatTab", label: "Gfycat" },
        { id: "chattypicsTab", label: "Chattypics" },
    ];

    return (
        <ToggleChildren
            id="uploader-toggle"
            childId="uploader-container"
            label="Image Uploader"
            visible={state.visible}
            clickHandler={onClickToggle}
        >
            <div id="tab-container">
                {tabs.map((tab) => {
                    return (
                        <Tab
                            key={tab.id}
                            id={tab.id}
                            label={tab.label}
                            selected={state.selectedTab === tab.id}
                            clickHandler={onClickTab}
                        />
                    );
                })}
            </div>
            <div id="uploader-body">
                <DropArea
                    fcRef={fileChooserRef}
                    multifile={state.multifile}
                    fileData={state.fileData}
                    formats={state.formats}
                    disabled={state.filesDisabled}
                    dispatch={dispatch}
                />
                <UrlInput state={state.urlData} disabled={state.urlDisabled} dispatch={dispatch} />
                <div id="uploader-btns">
                    <Button
                        id="upload-btn"
                        clickHandler={onClickUploadBtn}
                        disabled={state.uploadDisabled}
                        label="Upload"
                    />
                    <Button
                        id="cancel-btn"
                        clickHandler={onClickCancelBtn}
                        disabled={state.cancelDisabled}
                        label="Cancel"
                    />
                </div>
                <StatusLine
                    status={state.status}
                    error={state.error}
                    isPending={state.isPending}
                    animationEnd={onStatusAnimEnd}
                />
            </div>
        </ToggleChildren>
    );
};
export default ImageUploaderApp;
