import lzString from "lz-string";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { arrHas, classNames, elemMatches, objHas } from "../../core/common";
import { submitFormEvent } from "../../core/events";
import { getSetting, getSettings, setSetting } from "../../core/settings";

export interface Draft {
    body: string;
    postid: number;
    timestamp: number;
}

const compressString = (input: string) => lzString.compressToUTF16(input);
const decompressString = (input: string) => lzString.decompressFromUTF16(input);
const filterDraftsLRU = async (drafts: Draft[]) => {
    if (!arrHas(drafts)) return;
    const curTime = new Date().getTime();
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
    return lruByNewest;
};

const DraftsApp = (props: { postid: number; replyBox: HTMLElement }) => {
    const { postid, replyBox } = props || {};
    const postidRef = useRef(postid);
    const replyBoxRef = useRef(replyBox);
    const inputBoxRef = useRef(null as HTMLInputElement);
    const debouncedInput = useRef(null);

    const [drafts, setDrafts] = useState([] as Draft[]);
    const [valid, setValid] = useState(false);

    const handleInput = (e: KeyboardEvent) => {
        const _this = e.target as HTMLInputElement;
        const _val = _this?.value;
        // debounce compression to save some CPU time
        debouncedInput.current(_val);
    };
    const handleUpdate = useCallback(
        (val: string) => {
            (async () => {
                try {
                    const _drafts = [...drafts];
                    const foundIdx = _drafts.findIndex((d) => d.postid === postidRef.current);
                    // remove the existing record if there's no input to update
                    if (foundIdx > -1 && val.length === 0) {
                        _drafts.splice(foundIdx);
                        setDrafts(_drafts);
                        await setSetting("saved_drafts", _drafts);
                        return setValid(false);
                    }
                    const compressedBody = val.length > 0 ? compressString(val) : "";
                    const record = {
                        body: compressedBody,
                        postid: postidRef.current,
                        timestamp: new Date().getTime(),
                    } as Draft;

                    if (objHas(_drafts?.[foundIdx])) _drafts[foundIdx] = record;
                    else _drafts.push(record);
                    await setSetting("saved_drafts", _drafts);
                    setDrafts(_drafts);
                    setValid(compressedBody?.length > 0);
                } catch (e) {
                    console.error(e);
                }
            })();
        },
        [drafts],
    );

    const setInputFromDrafts = useCallback(() => {
        if (!arrHas(drafts)) return;
        const foundRecord = drafts.find((d) => d.postid === postidRef.current);
        const uncompressedBody = foundRecord?.body?.length > 0 && decompressString(foundRecord.body);
        if (uncompressedBody?.length > 0) inputBoxRef.current.value = uncompressedBody;
        setValid(uncompressedBody?.length > 0 || false);
    }, [drafts]);

    useEffect(() => {
        setInputFromDrafts();
    }, [setInputFromDrafts]);
    useEffect(() => {
        // keep our debouncer up-to-date when drafts change
        debouncedInput.current = debounce((val: string) => handleUpdate(val), 500);
    }, [handleUpdate]);
    useEffect(() => {
        if (!replyBoxRef.current) return;
        const handleSubmit = (e: Event) => {
            e.preventDefault();
            (async () => {
                const _this = e.target as HTMLButtonElement;
                if (elemMatches(_this, "#frm_submit")) {
                    const _drafts = (await getSetting("saved_drafts", [])) as Draft[];
                    const filtered = _drafts.filter((d) => d.postid !== postidRef.current);
                    // remove this draft from the list upon submission
                    await setSetting("saved_drafts", filtered);
                    setDrafts(filtered);
                    // avoid duplicate handlers when replybox closes
                    submitFormEvent.removeHandler(handleSubmit);
                }
            })();
        };

        const _input = replyBoxRef.current.querySelector("#frm_body") as HTMLInputElement;
        inputBoxRef.current = _input;
        _input.addEventListener("input", handleInput);
        submitFormEvent.addHandler(handleSubmit);

        (async () => {
            const _drafts = (await getSetting("saved_drafts", [])) as Draft[];
            // filter old drafts once upon loading
            const byLRU = await filterDraftsLRU(_drafts);
            if (JSON.stringify(byLRU) !== JSON.stringify(_drafts)) await setSetting("saved_drafts", byLRU);
            if (arrHas(byLRU)) setDrafts(byLRU);
        })();

        return () => {
            _input.removeEventListener("input", handleInput);
            submitFormEvent.removeHandler(handleSubmit);
        };
    }, []);

    return (
        <div
            className={classNames("drafts__dot", { valid, invalid: !valid })}
            title={valid ? "This post has been saved to drafts" : "This post is not saved to drafts"}
        />
    );
};

export { DraftsApp };
