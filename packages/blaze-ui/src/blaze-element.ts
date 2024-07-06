import type { Hook } from "./blaze-hooks";

export interface BlazeComponent<T extends any> {
  (props: T): BlazeNode;
}

export type BlazeElementType = string | BlazeComponent<any>;
export type BlazeElementProps = any;

export interface BlazeElement<
  T extends BlazeElementType,
  U extends BlazeElementProps,
> {
  type: T;
  props: U;
  __componentChildrenSnapshot?: BlazeNode;
  __componentContainer?: HTMLElement;
  __hooks?: Hook[];
  __domIndex?: number;
}

export type BlazeFragment = BlazeNode[];
export type BlazeTextNode = string | number | boolean;
export type BlazeNullNode = null | undefined;

export type BlazeNode =
  | BlazeTextNode
  | BlazeNullNode
  | BlazeElement<any, any>
  | BlazeFragment;

export function createElement<
  T extends BlazeElementType,
  U extends BlazeElementProps,
>(
  type: T,
  props:
    | (U & {
        children?: BlazeNode;
      })
    | null = null,
  ...children: BlazeNode[]
): BlazeElement<T, U> {
  const elementProps =
    props ||
    ({} as U & {
      children?: BlazeNode;
    });

  if (children.length === 1 && isBlazeNode(children[0])) {
    elementProps.children = children[0];
  } else if (children.length > 0) {
    elementProps.children = children.filter(
      (c) => c !== null && c !== undefined,
    );
  } else {
    elementProps.children = undefined;
  }

  Object.freeze(elementProps);

  return { type, props: elementProps };
}

type HTMLElementTagName = keyof HTMLElementTagNameMap;
type HTMLAttributes<T extends HTMLElementTagName> = {
  [K in keyof HTMLElementTagNameMap[T]]?: HTMLElementTagNameMap[T][K];
};

type Tags = {
  [K in HTMLElementTagName]: (
    first: Omit<HTMLAttributes<K>, "children"> | BlazeNode,
    ...children: BlazeNode[]
  ) => BlazeElement<K, HTMLAttributes<K>>;
};

export const tags = new Proxy(
  {},
  {
    get<T extends HTMLElementTagName>(_: any, key: T) {
      return (
        first: Omit<HTMLAttributes<T>, "children"> | BlazeNode,
        ...children: BlazeNode[]
      ) => {
        if (!isBlazeNode(first)) {
          return createElement(key, first, ...children);
        } else if (key === "input") {
          return createElement(key, first, ...children);
        } else {
          return createElement(key, null, ...[first, ...children]);
        }
      };
    },
  },
) as Tags;

export function isBlazeElement(node: any): node is BlazeElement<any, any> {
  return (
    typeof node === "object" && "type" in node && typeof node.type === "string"
  );
}

export function isBlazeComponent(
  node: any,
): node is BlazeElement<BlazeComponent<any>, any> {
  return (
    typeof node === "object" &&
    "type" in node &&
    typeof node.type === "function"
  );
}

export function isBlazeFragment(node: any): node is BlazeFragment {
  return Array.isArray(node);
}

export function isBlazeTextNode(node: any): node is BlazeTextNode {
  return (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "boolean"
  );
}

export function isBlazeNullNode(node: any): node is BlazeNullNode {
  return node === null || node === undefined;
}

export function isBlazeNode(node: any): node is BlazeNode {
  return (
    isBlazeTextNode(node) ||
    isBlazeNullNode(node) ||
    isBlazeElement(node) ||
    isBlazeFragment(node)
  );
}
