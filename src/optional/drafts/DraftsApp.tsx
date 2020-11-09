import React, { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { arrHas, classNames, elemMatches, compressString, decompressString, timeOverThresh } from "../../core/common";
import { replyFieldEvent, submitFormEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";

const filterDraftsLRU = async (drafts: Draft[]) => {
    if (!arrHas(drafts)) return [] as Draft[];
    //const maxAge = 1000 * 60 * 60 * 24; // 24hr timeout on saved drafts
    const maxAge = 1000 * 60 * 2; // 2min timeout on saved drafts
    // filter any posts that are older than the cutoff and order by ascending age
    const lruByNewest = [...drafts]
        .filter((d) => !timeOverThresh(d.timestamp, maxAge))
        .sort((a, b) => b.timestamp - a.timestamp);
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
        replyFieldEvent.raise(inputBox);
    }, [inputBox, inputVal]);
    useEffect(() => {
        const handleInput = (e: Event | HTMLInputElement) => {
            const _this = ((e as Event)?.target as HTMLInputElement) || (e as HTMLInputElement);
            const _val = _this?.value;
            setInputVal(_val);
            saveToDraft(_val);
        };
        const handleExternalInput = (el: HTMLInputElement) => handleInput(el);

        inputBox.addEventListener("input", handleInput);
        replyFieldEvent.addHandler(handleExternalInput);
        submitFormEvent.addHandler(handleSubmit);

        return () => {
            inputBox.removeEventListener("input", handleInput);
            replyFieldEvent.removeHandler(handleExternalInput);
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
