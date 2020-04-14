import * as React from "react";
import { createContext, useReducer, useContext } from "react";

/// provide an HOC for ease-of-use in creating multi-context state stores
type ProviderChildProps = { children?: React.ReactNode };
const createStore = (reducer, initialState) => {
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
    const useStoreState = () => useContext(stateContext);
    const useStoreDispatch = () => useContext(dispatchContext);
    return {
        Provider,
        useStoreState,
        useStoreDispatch,
    };
};
export default createStore;
