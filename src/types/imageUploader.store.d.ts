export {};

declare global {
  export type UploadSuccessPayload = string[];
  export interface UploadFailurePayload {
    code: number;
    msg: string;
  }
  export type UploaderAction =
    | LOAD_FILES_ACTION
    | LOAD_TAB_ACTION
    | LOAD_URL_ACTION
    | LOAD_INVALID_URL_ACTION
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
}
