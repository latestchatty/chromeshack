export {};

declare global {
  export interface PreviewReplacements {
    [propName: string]: {
      from: string[];
      to: string[];
    };
  }

  export type PurifyConfig = Record<string, any>;
  export interface ParseType {
    chattyPics?: boolean;
    chattyRSS?: boolean;
    instagram?: boolean;
    json?: boolean | PurifyConfig;
  }

  export interface FetchArgs extends RequestInit {
    url: string;
    fetchOpts?: RequestInit;
    parseType?: ParseType;
  }
  export interface PostArgs extends FetchArgs {
    data?: any;
  }

  export interface ShackRSSItem {
    title?: string;
    link?: string;
    date?: string;
    content?: string;
    medialink?: string;
  }
}
