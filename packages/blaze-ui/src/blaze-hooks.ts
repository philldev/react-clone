import type { BlazeComponent, BlazeElement } from "./blaze-element";
import {
  getCurrentComponentNode,
  getCurrentHookIndex,
  incrementCurrentHookIndex,
  tryRerenderComponent,
} from "./blaze-render";

export type Hook = {
  value: any;
  prevValue: any;
};

type Reducer<S, A> = (state: S, action: A) => S;
type Dispatch<A> = (action: A) => void;

export function useReducer<S, A>(
  reducer: Reducer<S, A>,
  initialState: S,
): [S, Dispatch<A>] {
  const componentNode = getCurrentComponentNode();

  if (componentNode === null) {
    throw new Error("useReducer must be used within a component");
  }

  const componentHooks = componentNode.__hooks!;

  const localHookIndex = getCurrentHookIndex();
  incrementCurrentHookIndex();

  if (componentHooks[localHookIndex] === undefined) {
    componentHooks[localHookIndex] = {
      value: initialState,
      prevValue: initialState,
    };
  }

  const dispatch = (action: A) => {
    const nextState = reducer(componentHooks[localHookIndex].value, action);
    componentHooks[localHookIndex].prevValue =
      componentHooks[localHookIndex].value;
    componentHooks[localHookIndex].value = nextState;
    tryRerenderComponent(componentNode);
  };

  return [componentHooks[localHookIndex].value, dispatch];
}

type SetStateAction<S> = S | ((prevState: S) => S);

export function useState<S>(initialState: S): [S, Dispatch<SetStateAction<S>>] {
  const [state, dispatch] = useReducer(
    (state: S, action: SetStateAction<S>) => {
      if (typeof action === "function") {
        return (action as (prevState: S) => S)(state);
      }
      return action;
    },
    initialState,
  );

  return [state, dispatch] as const;
}
