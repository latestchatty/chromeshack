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
        postFlash?: boolean;
        scrollParent?: boolean;
        scrollPost?: boolean;
        collapsed?: boolean;
    };
}
