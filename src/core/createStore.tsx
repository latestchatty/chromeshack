import React, { createContext, useReducer, useContext } from "react";

type BaseTypes = string | number | boolean | object | [];
export interface ReducerAction {
    type: string;
    payload?: BaseTypes;
}
export interface ReducerState {
    [key: string]: BaseTypes;
}
type StoreReducer = React.ReducerWithoutAction<ReducerState> | React.Reducer<ReducerState, ReducerAction>;
type ProviderChildProps = { children?: React.ReactNode };

/// provide an HOC for ease-of-use in creating multi-context state stores
const useCreateStore = (reducer: StoreReducer, initialState: ReducerState) => {
    const stateContext = createContext<ReducerState>({});
    const dispatchContext = createContext<React.Dispatch<ReducerAction>>(() => null);
    const Provider = ({ children }: ProviderChildProps) => {
        const [state, dispatch] = useReducer(reducer, initialState);
        return (
            <stateContext.Provider value={state}>
                <dispatchContext.Provider value={dispatch}>{children}</dispatchContext.Provider>
            </stateContext.Provider>
        );
    };
    const useStoreState = () => useContext(stateContext);
    const useStoreDispatch = () => useContext(dispatchContext);
    return {
        Provider,
        useStoreState,
        useStoreDispatch,
    };
};
export default useCreateStore;
