import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { arrHas, compressString, decompressString, timeOverThresh } from "../../core/common/common";
import { elemMatches } from "../../core/common/dom";
import { replyFieldEvent, submitFormEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";

export const filterDraftsLRU = async (drafts: Draft[]) => {
  if (!arrHas(drafts)) return [] as Draft[];
  const maxAge = 1000 * 60 * 60 * 18; // 18hr timeout on saved drafts
  // filter any posts that are older than the cutoff and order by ascending age
  const lruByNewest = [...drafts]
    .filter((d) => !timeOverThresh(d.timestamp, maxAge))
    .sort((a, b) => b.timestamp - a.timestamp);
  return lruByNewest || ([] as Draft[]);
};

const useDrafts = (postid: number, inputBox: HTMLInputElement) => {
  const [inputVal, setInputVal] = useState("");
  const [drafts, setDrafts] = useState([] as Draft[]);
  const [valid, setValid] = useState(false);

  const loadDraftsFromStore = useCallback(() => {
    (async () => {
      const _drafts = (await getSetting("saved_drafts", [])) as Draft[];
      // decompress once when loading from the store
      const decompressed = _drafts.map((d) => {
        const _decomp = decompressString(d.body);
        if (_decomp) return { ...d, body: _decomp };
      });
      const foundRecord = decompressed.filter((d) => d.postid === postid)?.[0];
      setDrafts(decompressed);
      if (foundRecord?.body) {
        setInputVal(foundRecord.body);
        setValid(true);
      } else {
        setInputVal("");
        setValid(false);
      }
    })();
  }, [postid]);

  const saveDraftsToStore = useCallback(
    (d: Draft[]) => {
      (async () => {
        // save CPU time by only compressing when saving to the store
        const _drafts =
          arrHas(d) &&
          d.map((_d) => {
            const _comp = compressString(_d.body);
            if (_comp) return { ..._d, body: _comp };
          });
        // filter out old drafts when saving
        const filtered = _drafts ? await filterDraftsLRU(_drafts) : [];
        await setSetting("saved_drafts", filtered);
        const foundRecord = filtered.filter((_d) => _d.postid === postid);
        setValid(arrHas(foundRecord));
      })();
    },
    [postid],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: "update on postid"
  const debouncedSave = useCallback(
    debounce((d: Draft[]) => saveDraftsToStore(d), 750),
    [saveDraftsToStore],
  );
  const _debouncedSave = useRef(debouncedSave).current;

  const saveToDraft = useCallback(
    (v: string) => {
      const _drafts = [...drafts];
      const foundIdx = _drafts.findIndex((d) => d.postid === postid);
      const record =
        v &&
        ({
          body: v,
          postid,
          timestamp: Date.now(),
        } as Draft);

      if (foundIdx > -1 && v.length === 0) _drafts.splice(foundIdx);
      else if (foundIdx === -1 && record) _drafts.unshift(record);
      else if (foundIdx > -1 && record) _drafts[foundIdx] = record;
      setDrafts(_drafts);
      _debouncedSave(_drafts);
    },
    [drafts, postid, _debouncedSave],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: "avoid circular"
  const handleSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      (async () => {
        const _this = e.target as HTMLButtonElement;
        if (elemMatches(_this, "#frm_submit")) {
          const _drafts = (await getSetting("saved_drafts", [])) as Draft[];
          const filtered = _drafts.filter((d) => d.postid !== postid);
          saveDraftsToStore(filtered);
          // avoid duplicate handlers when replybox closes
          submitFormEvent.removeHandler(handleSubmit);
        }
      })();
    },
    [saveDraftsToStore],
  );

  const handleInput = useCallback(
    (e: Event | HTMLInputElement) => {
      const _this = ((e as Event)?.target as HTMLInputElement) || (e as HTMLInputElement);
      const _val = _this?.value;
      setInputVal(_val);
      saveToDraft(_val);
    },
    [saveToDraft],
  );

  const handleExternalInput = useCallback((el: HTMLInputElement) => handleInput(el), [handleInput]);

  useEffect(() => {
    // handle the input box as a controlled input
    inputBox.value = inputVal;
    replyFieldEvent.raise(inputBox);
  }, [inputBox, inputVal]);
  useEffect(() => {
    inputBox.addEventListener("input", handleInput);
    replyFieldEvent.addHandler(handleExternalInput);
    submitFormEvent.addHandler(handleSubmit);
    return () => {
      inputBox.removeEventListener("input", handleInput);
      replyFieldEvent.removeHandler(handleExternalInput);
      submitFormEvent.removeHandler(handleSubmit);
    };
  }, [inputBox, handleInput, handleExternalInput, handleSubmit]);
  useEffect(() => {
    loadDraftsFromStore();
  }, [loadDraftsFromStore]);

  return valid;
};

export { useDrafts };
