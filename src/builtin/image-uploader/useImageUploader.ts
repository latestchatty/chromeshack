import React, { useCallback, useEffect, useRef } from "react";
import { handleImgurUpload } from "../../core/api/imgur";
import { arrHas } from "../../core/common/common";
import { appendLinksToField } from "../../core/common/dom";
import { getSetting, setSetting } from "../../core/settings";

/// tabs are defined by id and label
export const validTabs = [{ id: "imgurTab", label: "Imgur" }];

const useImageUploader = (
	parentRef: HTMLElement,
	state: UploaderState,
	dispatch: (action: UploaderAction) => void,
) => {
	const fileChooserRef = useRef(null);

	const doSelectTab = useCallback(
		(nextTabName?: string, prevTabName?: string) => {
			const nPrevTabName: TAB_NAMES = (prevTabName?.toUpperCase() ||
				validTabs[0].id.toUpperCase()) as TAB_NAMES;
			const nNextTabName: TAB_NAMES = (nextTabName?.toUpperCase() ||
				validTabs[0].id.toUpperCase()) as TAB_NAMES;
			// save our selected tab between sessions
			(async () => {
				await setSetting("selected_upload_tab", nNextTabName);
			})();
			dispatch({
				type: "LOAD_TAB",
				payload: { to: nNextTabName, from: nPrevTabName },
			});
		},
		[dispatch],
	);

	const onClickToggle = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
			e.preventDefault();
			const visibility = !state.visible;
			(async () => {
				await setSetting("image_uploader_toggled", visibility);
			})();
			dispatch({ type: "TOGGLE_UPLOADER", payload: visibility });
		},
		[state.visible, dispatch],
	);
	const onClickTab = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
			e.preventDefault();
			const this_node = e.target as HTMLDivElement;
			const thisTab = this_node?.id.toUpperCase();
			const prevTab = state.selectedTab.toUpperCase();
			doSelectTab(thisTab, prevTab);
		},
		[state.selectedTab, doSelectTab],
	);
	const onClickUploadBtn = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
			(async () => {
				e.preventDefault();
				if (!(e?.target as HTMLButtonElement).disabled) {
					const { fileData, urlData, selectedTab, urlDisabled } = state;
					const _tabName = selectedTab as TAB_NAMES;
					const data = arrHas(fileData)
						? fileData
						: !urlDisabled && urlData
						  ? [urlData]
						  : null;
					if (_tabName === "IMGURTAB") await handleImgurUpload(data, dispatch);
				}
			})();
		},
		[state, dispatch],
	);
	const onClickCancelBtn = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
			e?.preventDefault();
			dispatch({ type: "UPLOAD_CANCEL" });
			doSelectTab(state.selectedTab);
			fileChooserRef.current.value = null;
		},
		[state.selectedTab, dispatch, doSelectTab],
	);
	/// hide the statusline once the transition animation ends
	const onStatusAnimEnd = () =>
		dispatch({ type: "UPDATE_STATUS", payload: "" });

	useEffect(() => {
		/// update the reply box with links when data is returned from the server
		const thisElem = parentRef as HTMLElement;
		const replyField = thisElem?.querySelector("#frm_body") as HTMLInputElement;
		if (arrHas(state?.response) && replyField) {
			appendLinksToField(replyField, state.response);
			onClickCancelBtn(null);
		}
	}, [state.response, parentRef, onClickCancelBtn]);

	// restore our saved hoster tab
	useEffect(() => {
		(async () => {
			const tab = await getSetting("selected_upload_tab");
			const matches =
				tab! && validTabs.find((t) => t.id.toUpperCase() === tab.toUpperCase());
			// if we get an invalid tab name just default to our first choice
			if (tab && matches) doSelectTab(tab);
			else doSelectTab(tab?.[0]?.id);
		})();
	}, [doSelectTab]);
	// track whether the uploader container is visible on start
	useEffect(() => {
		(async () => {
			const is_toggled = (await getSetting(
				"image_uploader_toggled",
				true,
			)) as boolean;
			dispatch({ type: "TOGGLE_UPLOADER", payload: is_toggled });
		})();
	}, [dispatch]);

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
