import { arrHas, packValidTypes } from "../../core/common/common";
import { createStore } from "../../core/createStore";

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
    fileData: [] as File[],
    response: [],
    formats: `${imageFormats},${videoFormats}`,
    selectedTab: "IMGURTAB",
    urlData: "",
    status: "",
    error: null,
};

const tabReducer = (state: UploaderState, action: UploaderAction) => {
    // return the future state of the tab based on file/url input
    const urlAction = action as LOAD_URL_ACTION;
    const fileAction = action as LOAD_FILES_ACTION;
    const loadTabAction = action as LOAD_TAB_ACTION;
    const nextTabName = loadTabAction.payload?.to!;
    //const prevTabName = loadTabAction.payload.from || state.selectedTab;

    const stateHasUrl = state.urlData.length >= 13;
    const actionHasUrl = urlAction?.payload?.length >= 13 ? urlAction.payload : undefined;
    const stateHasFiles = state.fileData.length > 0 ? state.fileData : undefined;
    const actionHasFiles =
        fileAction?.payload?.length > 0 ? packValidTypes(state.formats, fileAction.payload) : undefined;

    const commonValidState = { filesDisabled: true, uploadDisabled: false, cancelDisabled: false };
    const commonInvalidState = { filesDisabled: false, uploadDisabled: true, cancelDisabled: true, urlData: "" };

    switch (action.type) {
        case "LOAD_TAB":
            if (nextTabName === "IMGURTAB") {
                const newState = {
                    ...state,
                    uploadDisabled: !(stateHasUrl || stateHasFiles),
                    cancelDisabled: !(stateHasUrl || stateHasFiles),
                    selectedTab: nextTabName,
                    filesDisabled: stateHasUrl || stateHasFiles || false,
                    urlDisabled: stateHasFiles || false,
                    multifile: false,
                    formats: `${imageFormats},${videoFormats}`,
                };
                // Imgur supports anonymous multi-file uploads so let's make an exception
                return nextTabName === "IMGURTAB" ? { ...newState, multifile: true } : newState;
            }
            break;
        case "LOAD_INVALID_URL":
            return {
                ...state,
                ...commonInvalidState,
            };
        case "LOAD_URL":
            return actionHasUrl
                ? {
                      ...state,
                      ...commonValidState,
                      urlDisabled: false,
                      urlData: actionHasUrl,
                  }
                : {
                      ...state,
                      ...commonInvalidState,
                  };
        case "LOAD_FILES":
            return arrHas(actionHasFiles)
                ? {
                      ...state,
                      ...commonValidState,
                      urlDisabled: true,
                      fileData: state.multifile ? actionHasFiles : [actionHasFiles[0]],
                  }
                : {
                      ...state,
                      ...commonInvalidState,
                  };

        default:
            return state;
    }
};

const UploaderReducer = (state: UploaderState, action: UploaderAction) => {
    switch (action.type) {
        case "LOAD_TAB":
            return tabReducer(state, action);
        case "TOGGLE_UPLOADER":
            return { ...state, visible: action.payload };
        case "LOAD_INVALID_URL":
        case "LOAD_FILES":
        case "LOAD_URL":
            return tabReducer(state, action);
        case "UPLOAD_PENDING":
            return { ...state, status: "Uploading...", isPending: true };
        case "UPLOAD_SUCCESS":
            return {
                ...state,
                response: action.payload,
                fileData: [] as File[],
                urlData: "",
                filesDisabled: false,
                urlDisabled: false,
                uploadDisabled: true,
                cancelDisabled: true,
                isPending: false,
                status: "Success!",
            };
        case "UPLOAD_FAILURE":
            const { code, msg } = action.payload;
            const _error = code ? `${code} ${msg}` : msg ? `${msg}` : "Something went wrong!";
            return {
                ...state,
                error: action.payload,
                cancelDisabled: false,
                status: _error,
            };
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
