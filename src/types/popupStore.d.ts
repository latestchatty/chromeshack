export type {};

declare global {
  export interface PopupState extends ReducerState {
    options: EnabledOptions[];
    builtins: EnabledBuiltinOptions[];
    suboptions: EnabledSuboptions[];
    notifications: string[];
    filters: string[];
    highlightgroups: HighlightGroup[];
    loaded: boolean;
    dispatch?: (action: PopupAction) => void;
  }

  export type OptionsTypes = "SET_OPTIONS" | "SET_BUILTINS" | "SET_SUBOPTIONS";
  export type FilterTypes = "SET_FILTERS" | "SET_NOTIFICATIONS";

  export type PopupAction =
    | { type: "INIT"; payload: PopupState }
    | { type: OptionsTypes; payload: EnabledOptions[] | EnabledBuiltinOptions[] | EnabledSuboptions[] }
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
