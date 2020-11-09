export {};

declare global {
    export interface Draft {
        body: string;
        postid: number;
        timestamp: number;
    }
}
