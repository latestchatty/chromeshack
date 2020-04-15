import * as browser from "webextension-polyfill";
import { Dispatch } from "react";

import { FormDataToJSON, isEmptyArr, isFileArr } from "../common";
import { UploaderAction, UploadSuccessPayload, UploadFailurePayload } from "../../builtin/image-uploader/uploaderStore";

const chattyPicsUrl = "https://chattypics.com/upload.php";

type UploadData = File[];
type ChattypicsResponse = string[];

const doChattypicsUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
    dispatch({ type: "UPLOAD_PENDING" });
    const fd = new FormData();
    if (!isFileArr(data)) return null;

    for (const file of data as File[]) fd.append("userfile[]", file);
    // if file is bigger than 3MB reject
    for (const v of data.values())
        if (v.size > 3 * 1000 * 1000) throw Error(`File is too large for Chattypics: ${v.name}`);

    const _dataBody = await FormDataToJSON(fd);
    const links: ChattypicsResponse = await browser.runtime.sendMessage({
        name: "corbPost",
        url: chattyPicsUrl,
        data: _dataBody,
        parseType: { chattyPics: true },
    });
    // sanitized in fetchSafe()
    return !isEmptyArr(links) ? links : [];
};

const handleChattypicsSuccess = (payload: UploadSuccessPayload, dispatch: Dispatch<UploaderAction>) =>
    dispatch({ type: "UPLOAD_SUCCESS", payload });

const handleChattypicsFailure = (payload: UploadFailurePayload, dispatch: Dispatch<UploaderAction>) =>
    dispatch({ type: "UPLOAD_FAILURE", payload });

const handleChattypicsUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
    try {
        const links: string[] = await doChattypicsUpload(data, dispatch);
        if (!isEmptyArr(links)) handleChattypicsSuccess(links, dispatch);
        else handleChattypicsFailure({ code: 400, msg: "Server returned no media links!" }, dispatch);
    } catch (e) {
        if (e) console.log(e);
        handleChattypicsFailure({ code: 401, msg: e.message || `Something went wrong!` }, dispatch);
    }
};
export default handleChattypicsUpload;
