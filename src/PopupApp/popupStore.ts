import { createStore } from "../core/createStore";
import type { PopupAction, PopupState } from "./index.d";

const initialState: PopupState = {
    options: [],
    suboptions: [],
    notifications: [],
    filters: [],
    highlightgroups: [],
};

const PopupReducer = (state: PopupState, action: PopupAction) => {
    switch (action.type) {
        case "INIT":
            return action.payload;
        case "SET_OPTIONS":
            return { ...state, options: action.payload };
        case "SET_SUBOPTIONS":
            return { ...state, suboptions: action.payload };
        case "SET_HIGHLIGHTGROUPS":
            return { ...state, highlightgroups: action.payload };
        case "UPDATE_HIGHLIGHTGROUP": {
            const _payload = action.payload.newGroup;
            const _groupName = action.payload.prevGroup || _payload.name;
            const _groups = [...state.highlightgroups];
            const idx = _groups.findIndex((g) => g.name.toUpperCase() === _groupName.toUpperCase());
            if (idx > -1) _groups[idx] = _payload;
            return { ...state, highlightgroups: _groups };
        }
        case "SET_NOTIFICATIONS":
            return { ...state, notifications: action.payload };
        case "SET_FILTERS":
            return { ...state, filters: action.payload };
        default:
            return state;
    }
};

export const usePopupStore = createStore(PopupReducer, initialState);
