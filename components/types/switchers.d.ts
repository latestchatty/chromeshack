export type {};

declare global {
  export interface SwitcherMatch extends ResolvedUser {
    matched: string;
  }
}
