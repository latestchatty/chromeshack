export type {};

declare global {
  export interface ResolvedUser {
    id: number;
    mod?: boolean;
    op?: boolean;
    postid?: number;
    username: string;
  }
  export interface ResolvedUsers {
    [x: string]: ResolvedUser[];
  }
}
