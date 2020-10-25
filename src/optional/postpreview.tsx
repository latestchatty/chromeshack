import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, render } from "react-dom";
import { debounce } from "ts-debounce";
import { classNames, elemMatches, generatePreview, scrollToElement } from "../core/common";
import { processPostBoxEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

const PostPreviewPane = (props: { target: HTMLElement; toggled: boolean; input: string }) => {
    const { target, toggled, input } = props || {};
    return createPortal(
        <div
            id="previewArea"
            className={classNames({ hidden: !toggled })}
            dangerouslySetInnerHTML={{ __html: input }}
        />,
        target,
    );
};

const PostPreviewApp = (props: { postboxElem: HTMLElement; paneMountElem: HTMLElement }) => {
    const { postboxElem, paneMountElem } = props || {};
    const [toggled, setToggled] = useState(false);
    const [input, setInput] = useState("");
    const postboxRef = useRef(postboxElem);
    const paneMountRef = useRef(paneMountElem);
    const fullpostRef = useRef(null);

    const debouncedInputRef = useRef(
        debounce((e: KeyboardEvent | HTMLElement) => {
            const _val = elemMatches(e as HTMLElement, "#frm_body")
                ? (e as HTMLInputElement)?.value
                : ((e as KeyboardEvent).target as HTMLInputElement)?.value;
            // generatePreview sanitizes input to conform to the shacktag schema
            const preview = _val ? generatePreview(_val) : "";
            if ((preview as string)?.length >= 0) setInput(preview);
        }, 250),
    );

    const handleInput = useCallback(
        (e: KeyboardEvent) => {
            if (toggled) debouncedInputRef.current(e);
        },
        [toggled],
    );
    const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        const inputArea = postboxRef.current.querySelector("#frm_body") as HTMLInputElement;
        if (inputArea.value.length > 0) debouncedInputRef.current(inputArea);
        setToggled((p) => !p);
    };

    useEffect(() => {
        (async () => {
            const replyBox = postboxRef.current.closest("div.inlinereply") as HTMLElement;
            const inputArea = postboxRef.current.querySelector("#frm_body") as HTMLInputElement;
            if (toggled && inputArea && replyBox) {
                inputArea.focus();
                // try to make sure the whole reply box is visible
                scrollToElement(replyBox, { toFit: true });
            }
            await setSetting("post_preview_toggled", toggled);
        })();
    }, [toggled]);
    useEffect(() => {
        if (!postboxRef.current) return;
        const inputArea = postboxRef.current.querySelector("#frm_body") as HTMLInputElement;
        const closeFormBtn = inputArea?.closest(".postbox")?.querySelector("div.closeform>a") as HTMLElement;

        fullpostRef.current = postboxRef.current.closest("li.sel") as HTMLElement;
        const jumpToNearestFullpost = () => {
            if (toggled) scrollToElement(fullpostRef.current, { toFit: true });
        };

        inputArea.addEventListener("input", handleInput);
        closeFormBtn.addEventListener("click", jumpToNearestFullpost);
        return () => {
            inputArea.removeEventListener("input", handleInput);
            closeFormBtn.removeEventListener("click", jumpToNearestFullpost);
        };
    }, [postboxRef, handleInput, toggled]);
    useLayoutEffect(() => {
        if (!postboxRef.current) return;
        (async () => {
            const is_toggled = (await getSetting("post_preview_toggled", false)) as boolean;
            setToggled(is_toggled);
        })();
    }, []);

    return (
        <>
            <PostPreviewPane target={paneMountRef.current} toggled={toggled} input={input} />
            <button id="previewButton" className={classNames({ toggled })} onClick={handleToggleClick}>
                Preview
            </button>
        </>
    );
};

const PostPreview = {
    async install() {
        const is_enabled = await enabledContains(["post_preview"]);
        if (is_enabled) processPostBoxEvent.addHandler(PostPreview.apply);
    },

    apply(postbox: HTMLElement) {
        const positionElem = postbox?.querySelector("div.csubmit");
        const container = postbox.querySelector("#post__preview__app");
        const altPositionElem = postbox?.querySelector("#frm_body");
        if (!container && positionElem) {
            const paneContainer = document.createElement("div");
            paneContainer.setAttribute("id", "post__preview__pane");
            altPositionElem.parentNode.insertBefore(paneContainer, altPositionElem);
            const appContainer = document.createElement("div");
            appContainer.setAttribute("id", "post__preview__app");
            render(<PostPreviewApp postboxElem={postbox} paneMountElem={paneContainer} />, appContainer);
            positionElem.appendChild(appContainer);
        }
    },
};

export { PostPreview };