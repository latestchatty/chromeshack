import { packValidTypes } from "../../core/common";
import { createStore } from "../../core/createStore";
import type { UploaderAction, UploaderState } from "./index.d";

export const imageFormats = "image/jpeg,image/png,image/gif,image/webp";
export const videoFormats =
    "video/mp4,video/webm,video/x-matroska,video/quicktime,video/x-flv,video/x-msvideo,video/x-ms-wmv,video/mpeg";

const initialState: UploaderState = {
    visible: true,
    multifile: true,
    filesDisabled: false,
    urlDisabled: false,
    uploadDisabled: true,
    cancelDisabled: true,
    isPending: false,
    fileData: [],
    response: [],
    formats: `${imageFormats},${videoFormats}`,
    selectedTab: "imgurTab",
    urlData: "",
    status: "",
    error: null,
};

const UploaderReducer = (state: UploaderState, action: UploaderAction) => {
    switch (action.type) {
        case "TOGGLE_UPLOADER":
            return { ...state, visible: !state.visible };
        case "CHANGE_TAB":
            return { ...state, selectedTab: action.payload };
        case "LOAD_FILES": {
            const files = packValidTypes(state.formats, action.payload);
            const isDisabled = files?.length === 0;
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
            const isDisabled = action.payload.length <= 7;
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
            // Imgur supports anonymous multi-file album uploads
            return {
                ...state,
                urlDisabled: false,
                multifile: action.type === "IMGURTAB_LOAD" ? true : false,
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
            // also used to reset the UI state for another upload
            return {
                ...state,
                response: [],
                fileData: [],
                urlData: "",
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
export const useUploaderStore = createStore(UploaderReducer, initialState);
