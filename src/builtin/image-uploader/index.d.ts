import type { ReducerState } from "../../core/createStore";

export type UploadSuccessPayload = string[];
export interface UploadFailurePayload {
    code: number;
    msg: string;
}
export type UploaderAction =
    | { type: "TOGGLE_UPLOADER"; payload?: boolean }
    | { type: "CHANGE_TAB"; payload: string }
    | { type: "LOAD_FILES"; payload: File[] | FileList }
    | { type: "LOAD_URL"; payload: string }
    | { type: "IMGURTAB_LOAD" }
    | { type: "GFYCATTAB_LOAD" }
    | { type: "CHATTYPICSTAB_LOAD" }
    | { type: "UPLOAD_PENDING" }
    | { type: "UPLOAD_CANCEL" }
    | { type: "UPLOAD_SUCCESS"; payload: UploadSuccessPayload }
    | { type: "UPLOAD_FAILURE"; payload: UploadFailurePayload }
    | { type: "UPDATE_STATUS"; payload: string };

export interface UploaderState extends ReducerState {
    visible: boolean;
    multifile: boolean;
    filesDisabled: boolean;
    urlDisabled: boolean;
    uploadDisabled: boolean;
    cancelDisabled: boolean;
    isPending: boolean;
    fileData: File[];
    response: string[];
    formats: string;
    selectedTab: string;
    urlData: string;
    status: string;
    error: {
        code: number;
        msg: string;
    };
}
