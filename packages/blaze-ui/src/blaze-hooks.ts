import type { BlazeComponent, BlazeElement } from "./blaze-element";
import {
  getCurrentComponentNode,
  getCurrentHookIndex,
  incrementCurrentHookIndex,
  tryRerenderComponent,
} from "./blaze-render";
import { arraysAreEqual } from "./utils";

export type Hook = {
  type: "state" | "effect";
  value: any;
  prevValue: any;
};

type Reducer<S, A> = (state: S, action: A) => S;
type Dispatch<A> = (action: A) => void;

const updateQueue: (() => void)[] = [];
let isBatchingUpdates = false;

const processUpdateQueue = (
  currentComponentNode: BlazeElement<BlazeComponent<any>, any>,
) => {
  while (updateQueue.length > 0) {
    const update = updateQueue.shift();
    if (update) update();
  }

  tryRerenderComponent(currentComponentNode);

  isBatchingUpdates = false;
};

const scheduleUpdate = (
  update: () => void,
  currentComponentNode: BlazeElement<BlazeComponent<any>, any>,
) => {
  updateQueue.push(update);
  if (!isBatchingUpdates) {
    isBatchingUpdates = true;
    queueMicrotask(() => processUpdateQueue(currentComponentNode));
  }
};

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
      type: "state",
      value: initialState,
      prevValue: initialState,
    };
  }

  const dispatch = (action: A) => {
    scheduleUpdate(() => {
      const nextState = reducer(componentHooks[localHookIndex].value, action);
      componentHooks[localHookIndex].prevValue =
        componentHooks[localHookIndex].value;
      componentHooks[localHookIndex].value = nextState;
    }, componentNode);
  };

  return [componentHooks[localHookIndex].value, dispatch];
}

type SetStateAction<S> = S | ((prevState: S) => S | S);

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

export function useEffect(effect: () => void | (() => void), deps?: any[]) {
  const componentNode = getCurrentComponentNode();

  if (componentNode === null) {
    throw new Error("useEffect must be used within a component");
  }

  const componentHooks = componentNode.__hooks!;

  const index = getCurrentHookIndex();
  incrementCurrentHookIndex();

  let hasChanged = true;

  let oldDeps = componentHooks[index]?.value?.deps;

  if (componentHooks[index] === undefined) {
    componentHooks[index] = {
      type: "effect",
      value: { deps },
      prevValue: null,
    };
  }

  if (oldDeps) {
    hasChanged = false;
    deps?.forEach((dep: any[], i: number) => {
      if (!Object.is(dep, oldDeps[i])) {
        hasChanged = true;
      }
    });
  }

  if (hasChanged) {
    const cleanup = effect();

    if (typeof cleanup === "function") {
      componentHooks[index].value.cleanup = cleanup;
    }
  }

  componentHooks[index].value.deps = deps;
}
