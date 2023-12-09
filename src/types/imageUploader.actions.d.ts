export {};

declare global {
  export type TAB_NAMES = "IMGURTAB";
  export type LOAD_TAB_ACTION = {
    type: "LOAD_TAB";
    payload: {
      to: TAB_NAMES;
      from?: TAB_NAMES;
    };
  };

  export type TOGGLE_UPLOADER_ACTION = {
    type: "TOGGLE_UPLOADER";
    payload?: boolean;
  };
  export type LOAD_FILES_ACTION = {
    type: "LOAD_FILES";
    payload: File[] | FileList;
  };
  export type LOAD_URL_ACTION = { type: "LOAD_URL"; payload: string };
  export type LOAD_INVALID_URL_ACTION = { type: "LOAD_INVALID_URL" };
  export type UPLOAD_PENDING_ACTION = { type: "UPLOAD_PENDING" };
  export type UPLOAD_CANCEL_ACTION = { type: "UPLOAD_CANCEL" };
  export type UPLOAD_SUCCESS_ACTION = {
    type: "UPLOAD_SUCCESS";
    payload: UploadSuccessPayload;
  };
  export type UPLOAD_FAILURE_ACTION = {
    type: "UPLOAD_FAILURE";
    payload: UploadFailurePayload;
  };
  export type UPDATE_STATUS_ACTION = { type: "UPDATE_STATUS"; payload: string };
}
