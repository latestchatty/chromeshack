export {};

declare global {
    export interface SwitcherMatch extends ResolvedUser {
        matched: string;
    }
}
