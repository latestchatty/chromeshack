import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { elemMatches, generatePreview, scrollToElement } from "../../core/common/dom";
import { replyFieldEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";

interface PostPreviewAppProps {
  postboxElem: HTMLElement;
  paneMountElem: HTMLElement;
}

interface PostPreviewExportedProps {
  paneMountRef: HTMLElement;
  toggled: boolean;
  input: string;
  handleToggleClick: () => void;
}

const usePostPreviewApp = (props: PostPreviewAppProps) => {
  const { postboxElem, paneMountElem } = props || {};

  const [toggled, setToggled] = useState(false);
  const [input, setInput] = useState("");

  const postboxRef = useRef(postboxElem).current;
  const paneMountRef = useRef(paneMountElem).current;
  const fullpostRef = useRef<HTMLElement | null>(null);

  const _generatePreview = useCallback((_input: string) => {
    // generatePreview sanitizes input to conform to the shacktag schema
    const preview = _input ? generatePreview(_input) : "";
    if ((preview as string)?.length >= 0) setInput(preview);
  }, []);

  const debouncedInputRef = useRef(
    debounce((el: HTMLInputElement) => {
      if (!elemMatches(el, "#frm_body")) return;
      _generatePreview(el.value);
    }, 250),
  ).current;

  const handleInput = useCallback(
    (e: Event) => {
      const _el = (e as Event)?.target as HTMLInputElement;
      if (!_el || !elemMatches(_el, "#frm_body")) return;
      debouncedInputRef(_el);
    },
    [debouncedInputRef],
  );
  const handleToggleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      const inputArea = postboxRef.querySelector("#frm_body") as HTMLInputElement;
      if (inputArea.value.length > 0) debouncedInputRef(inputArea);
      setToggled((p) => !p);
    },
    [debouncedInputRef, postboxRef],
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
      if (toggled && fullpostRef.current) scrollToElement(fullpostRef.current, { toFit: true });
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

  return { paneMountRef, toggled, input, handleToggleClick } as PostPreviewExportedProps;
};
export default usePostPreviewApp;
