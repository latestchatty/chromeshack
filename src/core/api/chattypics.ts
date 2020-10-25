import { Dispatch } from "react";
import type { UploadData } from "../../builtin/image-uploader/ImageUploaderApp";
import type { UploaderAction, UploadFailurePayload, UploadSuccessPayload } from "../../builtin/image-uploader/index.d";
import { arrEmpty, FormDataToJSON, isFileArr, isImage, isVideo, postBackground } from "../common";
import type { ParsedResponse } from "./";

const chattyPicsUrl = "https://chattypics.com/upload.php";

const parseLink = (href: string) => {
    const isChattyPics = /https?:\/\/(?:.*?\.)?(?:chattypics|shackpics)\.com\/(?:.+file=|files\/)([\w\-._@#$%^&!()[\]{}+']+\.(?:png|jpe?g|web[mp]|gifv?|mp4))/i.exec(
        href,
    );
    const src = isChattyPics ? `https://chattypics.com/files/${isChattyPics[1]}` : null;
    const type = isVideo(src) ? { type: "video" } : isImage(src) ? { type: "image" } : null;
    return type ? ({ ...type, src } as ParsedResponse) : null;
};

export const isChattypics = (href: string) => parseLink(href);

type ChattypicsResponse = string[];

const doChattypicsUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
    dispatch({ type: "UPLOAD_PENDING" });
    const fd = new FormData();
    if (!isFileArr(data)) return null;
    // if file is bigger than 3MB reject
    for (const v of (data as File[]).values()) {
        const file = v as File;
        if (file.size > 3 * 1000 * 1000) throw Error(`File is too large for Chattypics: ${file.name}`);
        fd.append("userfile[]", file);
    }

    const _dataBody = await FormDataToJSON(fd);
    const links: ChattypicsResponse = await postBackground({
        url: chattyPicsUrl,
        data: _dataBody,
        parseType: { chattyPics: true },
    });
    // sanitized in fetchSafe()
    return !arrEmpty(links) ? links : [];
};

const handleChattypicsSuccess = (payload: UploadSuccessPayload, dispatch: Dispatch<UploaderAction>) =>
    dispatch({ type: "UPLOAD_SUCCESS", payload });

const handleChattypicsFailure = (payload: UploadFailurePayload, dispatch: Dispatch<UploaderAction>) =>
    dispatch({ type: "UPLOAD_FAILURE", payload });

export const handleChattypicsUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
    try {
        if (!data) return;
        const links: string[] = await doChattypicsUpload(data, dispatch);
        if (!arrEmpty(links)) handleChattypicsSuccess(links, dispatch);
        else handleChattypicsFailure({ code: 400, msg: "Server returned no media links!" }, dispatch);
    } catch (e) {
        if (e) console.error(e);
        handleChattypicsFailure({ code: 401, msg: e.message || `Something went wrong!` }, dispatch);
    }
};
