import isEqual from "lodash.isequal";
import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { compressString, decompressString, timeOverThresh } from "../../core/common/common";
import { elemMatches } from "../../core/common/dom";
import { replyFieldEvent, submitFormEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";
import type { DraftsAppProps } from "./DraftsApp";

const filterDraftsLRU = async (drafts: Record<number, Draft>) => {
  if (!drafts || !Object.keys(drafts)) return {};
  const maxAge = 1000 * 60 * 60 * 24; // 24hr timeout on saved drafts
  const lruByNewest = Object.values(drafts)
    .filter((d) => !timeOverThresh(d.timestamp, maxAge))
    .sort((a, b) => b.timestamp - a.timestamp);
  return lruByNewest.reduce((acc, cur) => ({ ...acc, [cur.postid]: cur }), {});
};

interface DraftsAppExports {
  valid: boolean;
}

const useDraftsApp = (props: DraftsAppProps) => {
  const { postid, inputBox } = props || {};

  const [inputVal, setInputVal] = useState("");
  const [drafts, setDrafts] = useState({} as Record<number, Draft>);
  const [valid, setValid] = useState(false);

  const loadDraftsFromStore = useCallback(async () => {
    const _drafts = (await getSetting("saved_drafts", {})) as Record<number, Draft>;
    // decompress body of each property in the drafts object when loading from store
    const keys = Object.keys(_drafts);
    const decompressed = keys.length
      ? keys.reduce(
          (acc, k: string) => {
            const _k = Number.parseInt(k, 10);
            const cDraft = _drafts[_k];
            const dBody = decompressString(cDraft.body);
            if (dBody == null) return acc;
            acc[_k] = { ...cDraft, body: dBody };
            return acc;
          },
          {} as Record<number, Draft>,
        )
      : null;
    const foundRecord = decompressed?.[postid];

    if (decompressed != null) setDrafts(decompressed);
    if (foundRecord?.body) {
      setInputVal(foundRecord.body);
      setValid(true);
    } else {
      setInputVal("");
      setValid(false);
    }
  }, [postid]);

  const saveDraftsToStore = useCallback(
    async (d: Record<number, Draft>) => {
      // filter out old drafts when saving
      const current = (await getSetting("saved_drafts", {})) as Record<number, Draft>;
      const filtered = d && ((await filterDraftsLRU(d)) as Record<number, Draft>);
      // compress drafts object before saving to storage
      const keys = Object.keys(filtered);
      const compressed = keys.length
        ? keys.reduce(
            (acc, k) => {
              const _k = Number.parseInt(k, 10);
              const draft = d[_k];
              const cBody = compressString(draft.body);
              if (cBody == null) return acc;
              acc[_k] = { ...draft, body: cBody };
              return acc;
            },
            {} as Record<number, Draft>,
          )
        : null;
      if (compressed != null && !isEqual(compressed, current)) await setSetting("saved_drafts", compressed);
      const foundRecord = filtered?.[postid];
      if (foundRecord && filtered?.[postid]?.body) setValid(true);
    },
    [postid],
  );

  const debouncedSave = useRef(
    debounce((d: Record<number, Draft>) => {
      (async () => {
        saveDraftsToStore(d);
      })();
    }, 750),
  ).current;

  const saveToDraft = useCallback(
    (v: string) => {
      const _drafts = { ...drafts } as Record<number, Draft>;
      const record = { body: v, postid: postid, timestamp: Date.now() } as Draft;
      _drafts[postid] = record;
      setDrafts(_drafts);
      debouncedSave(_drafts);
    },
    [drafts, postid, debouncedSave],
  );

  useEffect(() => {
    // handle the input box as a controlled input
    inputBox.value = inputVal;
    setValid(false);
    // notify subscribers that the replybox has changed
    replyFieldEvent.raise(inputBox);
  }, [inputBox, inputVal]);

  useEffect(() => {
    const replyBtn = inputBox?.closest("li.sel")?.querySelector("div.reply>a");
    const closeBtn = inputBox?.closest("li.sel")?.querySelector("div.closeform>a");

    function registerHandlers() {
      inputBox.addEventListener("input", handleInput);
      replyFieldEvent.addHandler(handleInput);
      submitFormEvent.addHandler(handleSubmit);

      // add listeners on the REPLY and X buttons of the postbox...
      // to unregister the other handlers when the box is closed manually
      replyBtn?.addEventListener("click", unregisterHandlers);
      closeBtn?.addEventListener("click", unregisterHandlers);
    }
    function unregisterHandlers() {
      inputBox.removeEventListener("input", handleInput);
      replyFieldEvent.removeHandler(handleInput);
      submitFormEvent.removeHandler(handleSubmit);
      // remove our button handlers too for safety
      replyBtn?.removeEventListener("click", unregisterHandlers);
      closeBtn?.removeEventListener("click", unregisterHandlers);
    }

    function handleInput(e: Event | HTMLInputElement) {
      const _this = ((e as Event)?.target as HTMLInputElement) || (e as HTMLInputElement);
      const _e = (e as Event)?.target && (e as Event);
      _e?.preventDefault();
      _e?.stopPropagation();
      const _val = _this?.value;
      setInputVal(_val);
      saveToDraft(_val);
    }

    function handleSubmit(e: Event) {
      e.preventDefault();
      (async () => {
        const _this = e.target as HTMLButtonElement;
        if (!elemMatches(_this, "#frm_submit")) return;

        const _drafts = (await getSetting("saved_drafts", {})) as Record<number, Draft>;
        const _keys = Object.keys(_drafts);
        const filtered =
          _keys.length &&
          _keys.reduce(
            (acc, k) => {
              const _k = Number.parseInt(k, 10);
              if (_k !== postid) return { ...acc, [_k]: _drafts[_k] };
              return acc;
            },
            {} as Record<number, Draft>,
          );
        await saveDraftsToStore(filtered as Record<number, Draft>);
        setInputVal("");
        unregisterHandlers(); // avoid duplicate handlers when replybox closes
      })();
    }

    registerHandlers();
    return () => {
      unregisterHandlers();
    };
  }, [inputBox, postid, saveToDraft, saveDraftsToStore]);

  useEffect(() => {
    (async () => {
      await loadDraftsFromStore();
    })();
  }, [loadDraftsFromStore]);

  return { valid } as DraftsAppExports;
};
export default useDraftsApp;
