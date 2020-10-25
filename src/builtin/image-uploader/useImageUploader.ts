import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { handleChattypicsUpload } from "../../core/api/chattypics";
import { handleGfycatUpload } from "../../core/api/gfycat";
import { handleImgurUpload } from "../../core/api/imgur";
import { appendLinksToField, arrHas } from "../../core/common";
import { getSetting, setSetting } from "../../core/settings";
import { TAB_NAMES } from "./actions";
import type { UploaderAction, UploaderState } from "./index.d";

const useImageUploader = (parentRef: HTMLElement, state: UploaderState, dispatch: React.Dispatch<UploaderAction>) => {
    const fileChooserRef = useRef(null);

    const doSelectTab = useCallback(
        (nextTabName: string, prevTabName?: string) => {
            const nPrevTabName = prevTabName?.toUpperCase() as TAB_NAMES;
            const nNextTabName = nextTabName.toUpperCase() as TAB_NAMES;
            // save our selected tab between sessions
            setSetting("selected_upload_tab", nNextTabName).then(() => {
                dispatch({ type: "LOAD_TAB", payload: { to: nNextTabName, from: nPrevTabName } });
            });
        },
        [dispatch],
    );

    const onClickToggle = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        const visibility = !state.visible;
        setSetting("image_uploader_toggled", visibility).then(() =>
            dispatch({ type: "TOGGLE_UPLOADER", payload: visibility }),
        );
    };
    const onClickTab = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        const this_node = e.target as HTMLDivElement;
        const thisTab = this_node?.id.toUpperCase();
        const prevTab = state.selectedTab.toUpperCase();
        doSelectTab(thisTab, prevTab);
    };
    const onClickUploadBtn = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        (async () => {
            e.preventDefault();
            if (!(e?.target as HTMLButtonElement).disabled) {
                const { fileData, urlData, selectedTab, urlDisabled } = state;
                const _tabName = selectedTab as TAB_NAMES;
                const data = arrHas(fileData) ? fileData : !urlDisabled && urlData ? [urlData] : null;
                if (_tabName === "IMGURTAB") await handleImgurUpload(data, dispatch);
                else if (_tabName === "GFYCATTAB") await handleGfycatUpload(data, dispatch);
                else if (_tabName === "CHATTYPICSTAB") await handleChattypicsUpload(data as File[], dispatch);
            }
        })();
    };
    const onClickCancelBtn = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e?.preventDefault();
            dispatch({ type: "UPLOAD_CANCEL" });
            doSelectTab(state.selectedTab);
            fileChooserRef.current.value = null;
        },
        [state.selectedTab, dispatch, doSelectTab, fileChooserRef],
    );
    /// hide the statusline once the transition animation ends
    const onStatusAnimEnd = () => dispatch({ type: "UPDATE_STATUS", payload: "" });

    useEffect(() => {
        /// update the reply box with links when data is returned from the server
        const thisElem = parentRef as HTMLElement;
        const replyField = thisElem?.querySelector("#frm_body") as HTMLInputElement;
        if (arrHas(state?.response) && replyField) {
            appendLinksToField(replyField, state.response);
            onClickCancelBtn(null);
        }
    }, [state.response, dispatch, parentRef, onClickCancelBtn]);
    useEffect(() => {
        // restore our saved hoster tab
        getSetting("selected_upload_tab").then((tab: string) => {
            if (tab) doSelectTab(tab);
        });
    }, [doSelectTab]);

    // track whether the uploader container is visible on start
    useLayoutEffect(() => {
        (async () => {
            const is_toggled = await getSetting("image_uploader_toggled", true);
            dispatch({ type: "TOGGLE_UPLOADER", payload: is_toggled });
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        fileChooserRef,
        onClickCancelBtn,
        onClickTab,
        onClickToggle,
        onClickUploadBtn,
        onStatusAnimEnd,
    };
};

export { useImageUploader };
