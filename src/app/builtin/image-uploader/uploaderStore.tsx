import createStore from "../../core/createStore";
import { packValidTypes } from "../../core/common";

export const imageFormats = "image/jpeg,image/png,image/gif,image/webp";
export const videoFormats =
    "video/mp4,video/webm,video/x-matroska,video/quicktime,video/x-flv,video/x-msvideo,video/x-ms-wmv,video/mpeg";

export type UploadSuccessPayload = string[];
export interface UploadFailurePayload {
    code: number;
    msg: string;
}
export type UploaderAction =
    | { type: "TOGGLE_UPLOADER" }
    | { type: "CHANGE_TAB"; payload: string }
    | { type: "LOAD_FILES"; payload: File[] }
    | { type: "LOAD_URL"; payload: string }
    | { type: "IMGURTAB_LOAD" }
    | { type: "GFYCATTAB_LOAD" }
    | { type: "CHATTYPICSTAB_LOAD" }
    | { type: "UPLOAD_PENDING" }
    | { type: "UPLOAD_CANCEL" }
    | { type: "UPLOAD_SUCCESS"; payload: UploadSuccessPayload }
    | { type: "UPLOAD_FAILURE"; payload: UploadFailurePayload }
    | { type: "UPDATE_STATUS"; payload: string };

export interface UploaderState {
    visible: boolean;
    multifile: boolean;
    filesDisabled: boolean;
    urlDisabled: boolean;
    uploadDisabled: boolean;
    cancelDisabled: boolean;
    isPending: boolean;
    fileData: File[];
    selectedTab: string;
    urlData: string;
    formats: string;
    status: string;
    error: {
        code: number;
        msg: string;
    };
    response: string[];
}
const initialState: UploaderState = {
    visible: true,
    selectedTab: "imgurTab",
    multifile: false,
    fileData: [],
    filesDisabled: false,
    urlData: "",
    urlDisabled: false,
    uploadDisabled: true,
    cancelDisabled: true,
    formats: `${imageFormats},${videoFormats}`,
    response: null,
    error: null,
    status: "",
    isPending: false,
};

const UploaderReducer = (state: UploaderState, action: UploaderAction) => {
    switch (action.type) {
        case "TOGGLE_UPLOADER":
            return { ...state, visible: !state.visible };
        case "CHANGE_TAB":
            return { ...state, selectedTab: action.payload };
        case "LOAD_FILES": {
            const files = packValidTypes(state.formats, action.payload);
            const isDisabled = !(files && files.length > 0);
            const isMultifile = state.multifile;
            return {
                ...state,
                fileData: isMultifile ? files : [files[0]],
                urlDisabled: !isDisabled,
                uploadDisabled: isDisabled,
                cancelDisabled: isDisabled,
            };
        }
        case "LOAD_URL": {
            const isDisabled = !(action.payload.length > 7);
            return {
                ...state,
                urlData: action.payload,
                filesDisabled: !isDisabled,
                uploadDisabled: isDisabled,
                cancelDisabled: isDisabled,
            };
        }
        case "IMGURTAB_LOAD":
        case "GFYCATTAB_LOAD": {
            const formats = `${imageFormats},${videoFormats}`;
            return {
                ...state,
                urlDisabled: false,
                multifile: false,
                formats,
            };
        }
        case "CHATTYPICSTAB_LOAD": {
            const formats = `${imageFormats}`;
            return {
                ...state,
                urlDisabled: true,
                multifile: true,
                formats,
            };
        }
        case "UPLOAD_PENDING":
            return { ...state, status: "Uploading...", isPending: true };
        case "UPLOAD_SUCCESS":
            return {
                ...state,
                response: action.payload,
                fileData: [],
                urlData: "",
                filesDisabled: false,
                urlDisabled: false,
                uploadDisabled: true,
                cancelDisabled: true,
                isPending: false,
                status: "Success!",
            };
        case "UPLOAD_FAILURE": {
            const { code, msg } = action.payload;
            const _error = code ? `${code} ${msg}` : msg ? `${msg}` : "Something went wrong!";
            return {
                ...state,
                error: action.payload,
                cancelDisabled: false,
                status: _error,
            };
        }
        case "UPLOAD_CANCEL":
            return {
                ...state,
                urlData: "",
                fileData: [],
                filesDisabled: false,
                urlDisabled: false,
                uploadDisabled: true,
                cancelDisabled: true,
                isPending: false,
                error: null,
                status: "",
            };
        case "UPDATE_STATUS":
            return { ...state, error: null, status: action.payload };
        default:
            return state;
    }
};

/// expose a custom hook for ease of use
const useUploaderStore = createStore(UploaderReducer, initialState);
export default useUploaderStore;
