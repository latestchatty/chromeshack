// [mod]: "informative" | "nws" | "offtopic" | "political" | "stupid"
export interface ParsedReply {
    author: string;
    authorid: number;
    body: string;
    mod: string;
    op?: boolean;
    postid: number;
    parentRef?: HTMLElement;
}

export interface Recents {
    mostRecentRef: HTMLElement;
    recentTree: ParsedReply[];
    rootid: number;
}

export interface ParsedPost extends ParsedReply {
    count: number;
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
