import { memo, useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { classNames } from "../../core/common/common";
import { elemMatches, generatePreview, scrollToElement } from "../../core/common/dom";
import { replyFieldEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";
import { PostPreviewPane } from "./PostPreviewPane";

const PostPreviewApp = memo((props: { postboxElem: HTMLElement; paneMountElem: HTMLElement }) => {
  const { postboxElem, paneMountElem } = props || {};
  const [toggled, setToggled] = useState(false);
  const [input, setInput] = useState("");
  const postboxRef = useRef(postboxElem).current;
  const paneMountRef = useRef(paneMountElem).current;
  const fullpostRef = useRef(null);

  const _generatePreview = (_input: string) => {
    // generatePreview sanitizes input to conform to the shacktag schema
    const preview = _input ? generatePreview(_input) : "";
    if ((preview as string)?.length >= 0) setInput(preview);
  };

  const debouncedInputRef = useRef(
    debounce((e: KeyboardEvent | HTMLInputElement) => {
      const _val = elemMatches(e as HTMLInputElement, "#frm_body")
        ? (e as HTMLInputElement)?.value
        : ((e as KeyboardEvent).target as HTMLInputElement)?.value;
      _generatePreview(_val);
    }, 250)
  ).current;

  const handleInput = useCallback(
    (e: KeyboardEvent) => {
      if (toggled) debouncedInputRef(e);
    },
    [toggled, debouncedInputRef]
  );
  const handleToggleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
      if (inputArea.value.length > 0) debouncedInputRef(inputArea);
      setToggled((p) => !p);
    },
    [debouncedInputRef, postboxRef]
  );

  useEffect(() => {
    (async () => {
      const replyBox = postboxRef.closest("div.inlinereply") as HTMLElement;
      const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
      if (toggled && inputArea && replyBox) {
        inputArea.focus();
        // try to make sure the whole reply box is visible
        scrollToElement(replyBox, { toFit: true });
        _generatePreview(inputArea.value);
      }
      await setSetting("post_preview_toggled", toggled);
    })();
  }, [toggled, postboxRef, _generatePreview]);
  useEffect(() => {
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
  }, [postboxRef, handleInput, toggled, debouncedInputRef]);
  useEffect(() => {
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
});
export { PostPreviewApp };
