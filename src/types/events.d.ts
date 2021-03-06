export {};

declare global {
    export interface LiteEventInterface<T> {
        addHandler(handler: { (...args: T[]): void }): void;
        removeHandler(handler: { (...args: T[]): void }): void;
    }

    export interface PostboxEventArgs {
        postbox: HTMLElement;
    }
    export interface PostEventArgs {
        post?: HTMLElement;
        root?: HTMLElement;
        postid?: number;
        rootid?: number;
        is_root?: boolean;
    }
    export interface CollapsedPostEventArgs {
        threadid: number;
        is_collapsed: boolean;
    }
    export interface PendingPostEventArgs {
        pendings: PendingPost[];
    }
    export interface JumpToPostEventArgs {
        threadid: number;
    }

    export interface RefreshMutation {
        postid?: number;
        rootid?: number;
        parentid?: number;
    }
}
