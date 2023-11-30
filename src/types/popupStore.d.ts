export {};

declare global {
  export interface PopupState extends ReducerState {
    options: string[];
    suboptions: string[];
    notifications: string[];
    filters: string[];
    highlightgroups: HighlightGroup[];
  }

  export type OptionsTypes = "SET_OPTIONS" | "SET_SUBOPTIONS";
  export type FilterTypes = "SET_FILTERS" | "SET_NOTIFICATIONS";

  export type PopupAction =
    | { type: "INIT"; payload: PopupState }
    | { type: OptionsTypes; payload: string[] }
    | { type: FilterTypes; payload: string[] }
    | { type: "SET_HIGHLIGHTGROUPS"; payload: HighlightGroup[] }
    | {
        type: "UPDATE_HIGHLIGHTGROUP";
        payload: {
          prevGroup?: string;
          newGroup: HighlightGroup;
        };
      };
}
