export interface ReplyMatchArgs {
    mutation: HTMLElement;
    lastSibling: HTMLElement;
    lastRemoved: HTMLElement;
}

export interface PostEventArgs {
    post?: HTMLElement;
    root?: HTMLElement;
    postid?: number;
    rootid?: number;
    is_root?: boolean;
}

export interface RefreshMutation {
    postid?: number;
    rootid?: number;
    parentid?: number;
}
