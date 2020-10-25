import type { ReducerState } from "../../core/createStore";
import type {
    LOAD_FILES_ACTION,
    LOAD_TAB_ACTION,
    LOAD_URL_ACTION,
    TOGGLE_UPLOADER_ACTION,
    UPDATE_STATUS_ACTION,
    UPLOAD_CANCEL_ACTION,
    UPLOAD_FAILURE_ACTION,
    UPLOAD_PENDING_ACTION,
    UPLOAD_SUCCESS_ACTION,
} from "./actions.d";

export type UploadSuccessPayload = string[];
export interface UploadFailurePayload {
    code: number;
    msg: string;
}
export type UploaderAction =
    | LOAD_FILES_ACTION
    | LOAD_TAB_ACTION
    | LOAD_URL_ACTION
    | TOGGLE_UPLOADER_ACTION
    | UPDATE_STATUS_ACTION
    | UPLOAD_CANCEL_ACTION
    | UPLOAD_FAILURE_ACTION
    | UPLOAD_PENDING_ACTION
    | UPLOAD_SUCCESS_ACTION;

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

export interface ImageUploaderComponentProps {
    id?: string;
    childId?: string;
    label?: string;
    visible?: boolean;
    selected?: boolean;
    clickHandler?: any;
    children?: React.ReactNode | React.ReactNode[];
    fcRef?: React.Ref<HTMLInputElement>;
    multifile?: boolean;
    fileData?: File[];
    formats?: string;
    disabled?: boolean;
    dispatch?: React.Dispatch<UploaderAction>;
    state?: UploaderState | string;
    status?: string;
    error?: any;
    isPending?: boolean;
    animationEnd?: any;
}
