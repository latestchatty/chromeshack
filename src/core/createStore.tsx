import * as React from "react";
import { createContext, useReducer, useContext } from "react";

type BaseTypes = string | number | boolean | object | [];
export interface ReducerAction {
    type: string;
    payload?: BaseTypes;
}
export interface ReducerState {
    [key: string]: BaseTypes;
}
type StoreReducer = React.ReducerWithoutAction<ReducerState> | React.Reducer<ReducerState, ReducerAction>;

/// provide an HOC for ease-of-use in creating multi-context state stores
type ProviderChildProps = { children?: React.ReactNode };
const createStore = (reducer: StoreReducer, initialState: ReducerState) => {
    const stateContext = createContext(null);
    const dispatchContext = createContext(null);
    const Provider: React.FC = ({ children }: ProviderChildProps) => {
        const [state, dispatch] = useReducer(reducer, initialState);
        return (
            <stateContext.Provider value={state}>
                <dispatchContext.Provider value={dispatch}>{children}</dispatchContext.Provider>
            </stateContext.Provider>
        );
    };
    const useStoreState = () => useContext(stateContext as React.Context<ReducerState>);
    const useStoreDispatch = () => useContext(dispatchContext as React.Context<React.Dispatch<ReducerAction>>);
    return {
        Provider,
        useStoreState,
        useStoreDispatch,
    };
};
export default createStore;
