import React, { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { arrHas, classNames, elemMatches, compressString, decompressString } from "../../core/common";
import { submitFormEvent } from "../../core/events";
import { getSetting, getSettings, setSetting } from "../../core/settings";

export interface Draft {
    body: string;
    postid: number;
    timestamp: number;
}

const filterDraftsLRU = async (drafts: Draft[]) => {
    if (!arrHas(drafts)) return [] as Draft[];
    const curTime = Date.now();
    const maxSize = 5000000 * 0.75; // 75% of 5mb storage limit
    const maxAge = 1000 * 60 * 60 * 48; // 48hr timeout on saved drafts
    const settings = await getSettings();
    // filter any posts that are older than the cutoff and order by ascending age
    const lruByNewest = [...drafts]
        .filter((d) => Math.abs(curTime - d.timestamp) < maxAge)
        .sort((a, b) => b.timestamp - a.timestamp);
    // check what the size of the settings store would be if we stored this
    let setWithDrafts = JSON.stringify({ ...settings, saved_drafts: lruByNewest });
    // set our watermark at 90% of our defined storage limit
    while (setWithDrafts.length > maxSize * 0.9) {
        // remove the oldest elements from the list until this fits
        lruByNewest.pop();
        setWithDrafts = JSON.stringify({ ...settings, saved_drafts: lruByNewest });
    }
    return lruByNewest || ([] as Draft[]);
};

const DraftsApp = (props: { postid: number; inputBox: HTMLInputElement }) => {
    const { postid, inputBox } = props || {};
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
                if (filtered) await setSetting("saved_drafts", filtered);
                const foundRecord = filtered.filter((d) => d.postid === postid)?.[0];
                setValid(!!foundRecord);
            })();
        },
        [postid],
    );
    const debouncedSave = useRef(debounce((d: Draft[]) => saveDraftsToStore(d), 750)).current;
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
            debouncedSave(_drafts);
        },
        [drafts, postid, debouncedSave],
    );
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
        [postid, saveDraftsToStore],
    );

    useEffect(() => {
        // handle the input box as a controller input
        inputBox.value = inputVal;
    }, [inputBox, inputVal]);
    useEffect(() => {
        const handleInput = (e: KeyboardEvent) => {
            const _val = (e.target as HTMLInputElement).value;
            setInputVal(_val);
            saveToDraft(_val);
        };

        inputBox.addEventListener("input", handleInput);
        submitFormEvent.addHandler(handleSubmit);

        return () => {
            inputBox.removeEventListener("input", handleInput);
            submitFormEvent.removeHandler(handleSubmit);
        };
    }, [inputBox, handleSubmit, saveToDraft]);
    useEffect(() => {
        loadDraftsFromStore();
    }, [loadDraftsFromStore]);

    return (
        <div
            className={classNames("drafts__dot", { valid, invalid: !valid })}
            title={valid ? "This post has been saved to drafts" : "This post is not saved to drafts"}
        />
    );
};

export { DraftsApp };
