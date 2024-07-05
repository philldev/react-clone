import { getCurrentContainer, getCurrentNode, render } from "./render";

export let hooks: any[] = [];
export let hooksIndex = 0;

function resetIndex() {
  hooksIndex = 0;
}

function useEffect(effect: () => void, deps?: any[]) {
  let hasChanged = true;

  const oldDeps = hooks[hooksIndex];

  if (oldDeps && deps) {
    hasChanged = false;
    for (let i = 0; i < deps.length; i++) {
      if (deps[i] !== oldDeps[i]) {
        hasChanged = true;
        break;
      }
    }
  }

  if (hasChanged) {
    effect();
  }

  hooks[hooksIndex] = deps;
  hooksIndex++;
}

type Reducer<S, A> = (state: S, action: A) => S;

function useReducer<S, A>(reducer: Reducer<S, A>, initialState: S) {
  const localIndex = hooksIndex;
  const currentState = hooks[localIndex];
  hooksIndex++;

  if (currentState === undefined) {
    hooks[localIndex] = initialState;
  }

  const dispatch = (action: A) => {
    const nextState = reducer(currentState, action);
    hooks[localIndex] = nextState;
    render(getCurrentNode()!, getCurrentContainer()!);
  };

  return [hooks[localIndex] as S, dispatch] as const;
}

type SetStateAction<S> = S | ((prevState: S) => S);

function useState<S>(initialState: S) {
  const reducer = (state: S, action: SetStateAction<S>) => {
    if (typeof action === "function") {
      return (action as (state: S) => S)(state);
    }
    return action;
  };

  return useReducer(reducer, initialState);
}

export { useState, useEffect, resetIndex, useReducer };
