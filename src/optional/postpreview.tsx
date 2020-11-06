import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, render } from "react-dom";
import { debounce } from "ts-debounce";
import { classNames, elemMatches, generatePreview, scrollToElement } from "../core/common";
import { processPostBoxEvent, replyFieldEvent } from "../core/events";
import { PostboxEventArgs } from "../core/events.d";
import { enabledContains, getSetting, setSetting } from "../core/settings";
import parse, { DomElement, domToReact } from "html-react-parser";
import "../styles/post_preview.css";

const PostPreviewPane = (props: { target: HTMLElement; toggled: boolean; input: string }) => {
    const { target, toggled, input } = props || {};
    const onSpoilerClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        const _this = e.target as HTMLElement;
        if (!_this?.classList?.contains("jt_spoiler_clicked")) {
            _this.classList.remove("jt_spoiler");
            _this.classList.add("jt_spoiler_clicked");
        }
    };
    const modifySpoiler = (node: DomElement) => {
        if (node.name === "span" && node.attribs["class"].includes("jt_spoiler"))
            return (
                <span className={node.attribs["class"]} onClick={onSpoilerClick}>
                    {domToReact(node.children)}
                </span>
            );
    };
    return createPortal(
        <div id="previewArea" className={classNames({ hidden: !toggled })}>
            {parse(input, { replace: (node) => modifySpoiler(node) })}
        </div>,
        target,
    );
};

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
    useEffect(() => {
        if (!postboxRef) return;
        const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
        const closeFormBtn = inputArea?.closest(".postbox")?.querySelector("div.closeform>a") as HTMLElement;

        fullpostRef.current = postboxRef.closest("li.sel") as HTMLElement;
        const jumpToNearestFullpost = () => {
            if (toggled) scrollToElement(fullpostRef.current, { toFit: true });
        };
        const handleExternalInput = (el: HTMLInputElement) => debouncedInputRef(el);

        inputArea.addEventListener("input", handleInput);
        replyFieldEvent.addHandler(handleExternalInput);
        closeFormBtn.addEventListener("click", jumpToNearestFullpost);
        return () => {
            inputArea.removeEventListener("input", handleInput);
            replyFieldEvent.removeHandler(handleExternalInput);
            closeFormBtn.removeEventListener("click", jumpToNearestFullpost);
        };
    }, [postboxRef, handleInput, toggled, debouncedInputRef]);
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

const PostPreview = {
    install() {
        processPostBoxEvent.addHandler(PostPreview.apply);
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const is_enabled = await enabledContains(["post_preview"]);
        const positionElem = postbox?.querySelector("div.csubmit");
        const container = postbox.querySelector("#post__preview__app");
        const altPositionElem = postbox?.querySelector("#frm_body");
        if (is_enabled && !container && positionElem) {
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
