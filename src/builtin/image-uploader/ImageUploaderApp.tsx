import React, { memo, useRef } from "react";
import { Button, DropArea, StatusLine, Tab, ToggleChildren, UrlInput } from "./Components";
import { useUploaderStore } from "./uploaderStore";
import { useImageUploader, validTabs } from "./useImageUploader";

const ImageUploaderApp = memo((props: { postboxEl: HTMLElement }) => {
    const { postboxEl } = props || {};
    const parentRef = useRef(postboxEl);

    const { useStoreState: useUploaderState, useStoreDispatch: useUploaderDispatch } = useUploaderStore;
    const state = useUploaderState() as UploaderState;
    const dispatch = useUploaderDispatch() as React.Dispatch<UploaderAction>;

    const {
        fileChooserRef,
        onClickCancelBtn,
        onClickTab,
        onClickToggle,
        onClickUploadBtn,
        onStatusAnimEnd,
    } = useImageUploader(parentRef.current, state, dispatch);

    return (
        <ToggleChildren
            id="uploader-toggle"
            childId="uploader-container"
            label="Image Uploader"
            visible={state.visible}
            clickHandler={onClickToggle}
        >
            <div id="tab-container">
                {validTabs.map((tab) => {
                    return (
                        <Tab
                            key={tab.id}
                            id={tab.id}
                            label={tab.label}
                            selected={state.selectedTab.toUpperCase() === tab.id.toUpperCase()}
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
});

export { ImageUploaderApp };
