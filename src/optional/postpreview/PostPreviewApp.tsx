import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { classNames, elemMatches, generatePreview, scrollToElement } from "../../core/common";
import { replyFieldEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";
import { PostPreviewPane } from "./PostPreviewPane";

const PostPreviewApp = (props: { postboxElem: HTMLElement; paneMountElem: HTMLElement }) => {
    const { postboxElem, paneMountElem } = props || {};
    const [toggled, setToggled] = useState(false);
    const [input, setInput] = useState("");
    const postboxRef = useRef(postboxElem).current;
    const paneMountRef = useRef(paneMountElem).current;
    const fullpostRef = useRef(null);

    const debouncedInputRef = useRef(
        debounce((e: KeyboardEvent | HTMLInputElement) => {
            const _val = elemMatches(e as HTMLInputElement, "#frm_body")
                ? (e as HTMLInputElement)?.value
                : ((e as KeyboardEvent).target as HTMLInputElement)?.value;
            // generatePreview sanitizes input to conform to the shacktag schema
            const preview = _val ? generatePreview(_val) : "";
            if ((preview as string)?.length >= 0) setInput(preview);
        }, 250),
    ).current;

    const handleInput = useCallback(
        (e: KeyboardEvent) => {
            if (toggled) debouncedInputRef(e);
        },
        [toggled, debouncedInputRef],
    );
    const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
        if (inputArea.value.length > 0) debouncedInputRef(inputArea);
        setToggled((p) => !p);
    };

    useEffect(() => {
        (async () => {
            const replyBox = postboxRef.closest("div.inlinereply") as HTMLElement;
            const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
            if (toggled && inputArea && replyBox) {
                inputArea.focus();
                // try to make sure the whole reply box is visible
                scrollToElement(replyBox, { toFit: true });
            }
            await setSetting("post_preview_toggled", toggled);
        })();
    }, [toggled, postboxRef]);
    useLayoutEffect(() => {
        if (!postboxRef) return;
        const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
        const parentFullpost = postboxRef.closest("li.sel");
        const replyBtn = parentFullpost?.querySelector(".fullpost .reply>a") as HTMLElement;
        const closeFormBtn = inputArea?.closest(".postbox")?.querySelector("div.closeform>a") as HTMLElement;

        fullpostRef.current = postboxRef.closest("li.sel") as HTMLElement;
        const jumpToNearestFullpost = () => {
            if (toggled) scrollToElement(fullpostRef.current, { toFit: true });
        };
        const handleExternalInput = (el: HTMLInputElement) => debouncedInputRef(el);

        inputArea.addEventListener("input", handleInput);
        replyFieldEvent.addHandler(handleExternalInput);
        replyBtn?.addEventListener("click", jumpToNearestFullpost);
        closeFormBtn.addEventListener("click", jumpToNearestFullpost);
        return () => {
            inputArea.removeEventListener("input", handleInput);
            replyFieldEvent.removeHandler(handleExternalInput);
            replyBtn?.removeEventListener("click", jumpToNearestFullpost);
            closeFormBtn.removeEventListener("click", jumpToNearestFullpost);
        };
    }, [paneMountRef, postboxRef, handleInput, toggled, debouncedInputRef]);
    useLayoutEffect(() => {
        (async () => {
            const is_toggled = (await getSetting("post_preview_toggled", false)) as boolean;
            setToggled(is_toggled);
        })();
    }, []);

    return (
        <>
            <PostPreviewPane target={paneMountRef} toggled={toggled} input={input} />
            <button id="previewButton" className={classNames({ toggled })} onClick={handleToggleClick}>
                Preview
            </button>
        </>
    );
};
export { PostPreviewApp };
