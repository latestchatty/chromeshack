export type {};

declare global {
  type BaseTypes = string | number | boolean | Record<string, any> | [];
  export interface ReducerAction {
    type: string;
    payload?: BaseTypes;
  }
  export interface ReducerState {
    [key: string]: BaseTypes;
    dispatch: (args: ReducerAction) => any;
  }
  type StoreReducer = React.ReducerWithoutAction<ReducerState> | React.Reducer<ReducerState, ReducerAction>;
  type ProviderChildProps = { children?: React.ReactNode };
}
