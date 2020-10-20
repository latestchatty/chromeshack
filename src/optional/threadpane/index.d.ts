// [mod]: "informative" | "nws" | "offtopic" | "political" | "stupid"
export interface ParsedReply {
    author: string;
    body: string;
    mod: string;
    postid: number;
    parentRef?: HTMLElement;
}

export interface Recents {
    mostRecentRef: HTMLElement;
    recentTree: ParsedReply[];
    rootid: number;
}

export interface ParsedPost {
    author: string;
    body: string;
    count: number;
    mod: string;
    recents: Recents;
    rootid: number;
}

export interface JumpToPostArgs {
    postid?: number;
    rootid?: number;
    options?: {
        cardFlash?: boolean;
        collapsed?: boolean;
        postFlash?: boolean;
        scrollParent?: boolean;
        scrollPost?: boolean;
        toFit?: boolean;
        uncap?: boolean;
    };
}

export type CSSDict = Record<string, string>;
export interface AuthorCSSDict {
    [x: string]:
        | CSSDict
        | {
              [x: string]: CSSDict;
          };
}
