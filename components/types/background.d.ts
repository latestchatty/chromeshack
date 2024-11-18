export type {};

declare global {
  export type OnMessageRequestName =
    | "launchIncognito"
    | "allowedIncognitoAccess"
    | "chatViewFix"
    | "scrollByKeyFix"
    | "corbFetch"
    | "corbPost";
  export interface OnMessageRequest {
    name: OnMessageRequestName;
    data?: any;
    value?: string;
    url?: string;
    fetchOpts: FetchArgs;
    headers: any;
    parseType: any;
  }
}
