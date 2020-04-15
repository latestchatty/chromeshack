import { Dispatch } from "react";

import { waitToFetchSafe, fetchSafe, fetchSafeLegacy, isFileArr, isEmptyObj, isUrlArr } from "../common";
import { UploaderAction, UploadSuccessPayload, UploadFailurePayload } from "../../builtin/image-uploader/uploaderStore";

const gfycatApiUrl = "https://api.gfycat.com/v1/gfycats"; // GET
const gfycatStatusUrl = "https://api.gfycat.com/v1/gfycats/fetch/status"; // GET
const gfycatDropUrl = "https://filedrop.gfycat.com"; // POST

type UploadData = string[] | File[];
interface GfycatResponse {
    task?: string;
    gfyname?: string;
    code?: string;
    errorMessage?: {
        code?: string;
        description?: string;
    };
    gfyItem?: {
        webmUrl?: string;
        mobileUrl?: string;
    };
}

export const doResolveGfycat = async (gfyname: string) => {
    /// resolves a gfycat nonce to its media url
    try {
        const url = `${gfycatApiUrl}/${gfyname}`;
        const result: GfycatResponse = window.chrome ? await fetchSafe({ url }) : await fetchSafeLegacy({ url });
        // sanitized in common.js
        const media = result?.gfyItem?.mobileUrl || result?.gfyItem?.webmUrl;
        return media ? [media] : null;
    } catch (e) {
        if (e) console.log(e);
        console.log("Couldn't resolve Gfycat:", gfyname);
        return null;
    }
};

const doGfycatDropKey = async (data?: UploadData) => {
    /// notifies the Gfycat drop endpoint that we wish to upload media
    // if we have a media URL to fetch then hand it off to Gfycat for server-side encoding
    const dataBody = isUrlArr(data) ? JSON.stringify({ fetchUrl: data[0] }) : undefined;
    const key: GfycatResponse = await fetchSafe({
        url: gfycatApiUrl,
        fetchOpts: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: dataBody,
        },
    });
    return !isEmptyObj(key) ? key?.gfyname : null;
};

const doGfycatStatus = async (key: string) => {
    /// returns the status of a gfycat nonce (and its proper name)
    let monitor = true; // guard
    let status: GfycatResponse;
    let result: string | UploadFailurePayload;

    const maxTimeout = 5 * 60 * 1000; // 5 minutes
    const maxAttempts = 10;
    const interval = 1500;
    let elapsed = 0;
    let attempts = 0;

    while (monitor && elapsed < maxTimeout && attempts <= maxAttempts) {
        status = await waitToFetchSafe(interval, { url: `${gfycatStatusUrl}/${key}` });
        elapsed += interval; // increment on await
        if (status?.task === "complete" && status?.gfyname) result = status?.gfyname;
        else if (status?.task === "NotFoundo") {
            // try multiple times in case the backend needs time to resolve an upload
            if (attempts < maxAttempts) attempts += 1;
            else {
                result = {
                    code: 400,
                    msg: `Gfycat returned NotFoundo for: ${key}`,
                };
            }
        } else if (status?.task === "error") {
            result = {
                code: parseInt(status?.errorMessage?.code) || 400,
                msg: status?.errorMessage?.description || "Something went wrong!",
            };
        }
        if (result) monitor = false;
    }
    if (interval >= maxTimeout) result = { code: 500, msg: "Gfycat timed out waiting for upload status!" };
    return result ? result : null;
};

const doGfycatUpload = async (data: UploadData, key: string, dispatch: Dispatch<UploaderAction>) => {
    /// this will push a File object to the Gfycat drop endpoint
    if (isFileArr(data)) {
        for (const file of data as File[]) {
            const dataBody = new FormData();
            dataBody.append("key", key);
            dataBody.append("file", new File([file], key, { type: file.type }));
            await fetchSafe({
                url: gfycatDropUrl,
                fetchOpts: { method: "POST", body: dataBody },
            });
        }
    } else throw new Error(`Unable to upload non-File data to endpoint: ${gfycatDropUrl}`);
};

const handleGfycatUploadSuccess = (payload: UploadSuccessPayload, dispatch: Dispatch<UploaderAction>) =>
    dispatch({ type: "UPLOAD_SUCCESS", payload });

const handleGfycatUploadFailure = (payload: UploadFailurePayload, dispatch: Dispatch<UploaderAction>) => {
    console.log(payload);
    dispatch({ type: "UPLOAD_FAILURE", payload });
};

const handleGfycatUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
    /// FSM: dropKey (mediaUrl optional) -> upload (if applicable) -> status => resolve
    try {
        dispatch({ type: "UPLOAD_PENDING" });

        // if our data is a media URL it will be handed off to Gfycat here
        const key = await doGfycatDropKey(data);
        if (!key) throw new Error("doGfycatDropKey failed!");

        if (isUrlArr(data)) {
            // use the gfyname from the drop key step to resolve our encoded media url
            const urlUpload = await doGfycatStatus(key);
            if (typeof urlUpload === "string") {
                const resolved = await doResolveGfycat(key);
                if (resolved && typeof resolved[0] === "string") return handleGfycatUploadSuccess(resolved, dispatch);
                else {
                    return handleGfycatUploadFailure(
                        { code: 500, msg: `Unable to resolve the uploaded Gfycat: ${key}` },
                        dispatch,
                    );
                }
            } else return handleGfycatUploadFailure(urlUpload, dispatch);
        } else if (isFileArr(data)) {
            await doGfycatUpload(data, key, dispatch);
            const encodedGfy = await doGfycatStatus(key); // wait for the encode
            if (typeof encodedGfy === "string") {
                const media = await doResolveGfycat(encodedGfy);
                if (media) handleGfycatUploadSuccess(media, dispatch);
            } else handleGfycatUploadFailure(encodedGfy, dispatch);
        }
    } catch (e) {
        if (e) console.log(e);
        handleGfycatUploadFailure({ code: 400, msg: e.message || `Something went wrong!` }, dispatch);
    }
};
export default handleGfycatUpload;
