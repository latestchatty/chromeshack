import React, { useCallback, useEffect, useRef } from "react";
import { handleChattypicsUpload } from "../../core/api/chattypics";
import { handleGfycatUpload } from "../../core/api/gfycat";
import { handleImgurUpload } from "../../core/api/imgur";
import { appendLinksToField, arrHas } from "../../core/common";
import { getSetting, setSetting } from "../../core/settings";
import { Button, DropArea, StatusLine, Tab, ToggleChildren, UrlInput } from "./Components";
import type { UploaderState } from "./index.d";
import { useUploaderStore } from "./uploaderStore";

export type UploadData = string[] | File[];
interface ImageUploaderAppProps {
    parentRef: HTMLElement;
}
const ImageUploaderApp = (props: ImageUploaderAppProps) => {
    const { useStoreState: useUploaderState, useStoreDispatch: useUploaderDispatch } = useUploaderStore;
    const state = useUploaderState() as UploaderState;
    const dispatch = useUploaderDispatch();
    const fileChooserRef = useRef(null);

    const doSelectTab = useCallback(
        (tabName: string) => {
            const normalizedTabName = `${tabName.toUpperCase()}_LOAD`;
            dispatch({ type: "CHANGE_TAB", payload: tabName });
            dispatch({ type: normalizedTabName });
            // save our selected tab between sessions
            setSetting("selected_tab", tabName);
        },
        [dispatch],
    );

    const onClickToggle = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        dispatch({ type: "TOGGLE_UPLOADER" });
    };
    const onClickTab = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        const this_node = e.target as HTMLDivElement;
        const thisTab = this_node?.id;
        if (thisTab !== state.selectedTab) doSelectTab(thisTab);
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
    }, [state.response, dispatch, props.parentRef]);
    useEffect(() => {
        // restore our saved hoster tab
        getSetting("selected_tab").then((tab: string) => {
            if (tab) doSelectTab(tab);
        });
    }, [doSelectTab]);

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

export { ImageUploaderApp };
