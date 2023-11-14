import React, { createContext, useContext, useReducer } from "react";

/// provide an HOC for ease-of-use in creating multi-context state stores
export const useStore = (reducer: StoreReducer, initialState: ReducerState) => {
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
