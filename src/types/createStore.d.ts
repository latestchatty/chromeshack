export {};

declare global {
  type BaseTypes = string | number | boolean | Record<string, any> | [];
  export interface ReducerAction {
    type: string;
    payload?: BaseTypes;
  }
  export interface ReducerState {
    [key: string]: BaseTypes;
  }
  type StoreReducer =
    | React.ReducerWithoutAction<ReducerState>
    | React.Reducer<ReducerState, ReducerAction>;
  type ProviderChildProps = { children?: React.ReactNode };
}
