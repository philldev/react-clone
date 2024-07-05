export interface BlazeElement<T extends string | BlazeComponent<P>, P> {
  type: T;
  props: P;
  __nodeSnapshots?: T extends BlazeComponent<any> ? BlazeNode : never;
}
export interface BlazeComponent<P> {
  (props: P): BlazeNode;
}
export type BlazeFragment = BlazeNode[];
export type BlazeNode =
  | BlazeElement<any, any>
  | BlazeFragment
  | string
  | number
  | boolean
  | null
  | undefined;

type HTMLTagName = keyof HTMLElementTagNameMap;
export type HTMLAttributes<T extends HTMLTagName> = HTMLElementTagNameMap[T];

function createElement<P extends HTMLAttributes<T>, T extends HTMLTagName>(
  type: T,
  props: Partial<P> | null,
  ...children: BlazeNode[]
): BlazeElement<T, P>;

function createElement<P extends {}>(
  type: BlazeComponent<P>,
  props?: P | null,
  ...children: BlazeNode[]
): BlazeElement<BlazeComponent<P>, P>;

function createElement<P extends {}, T extends string | BlazeComponent<P>>(
  type: T,
  props?: P | null,
  ...children: BlazeNode[]
): BlazeElement<T, P> {
  const elProps = props ?? ({} as any);

  if (Array.isArray(children) && children.length > 0) {
    elProps.children = children;
  }

  return {
    type,
    props: elProps,
  };
}

function fragment(...children: BlazeNode[]): BlazeFragment {
  return children;
}

function isBlazeNode(node: any): node is BlazeNode {
  return (
    (typeof node === "object" && "type" in node) ||
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "boolean" ||
    node === null ||
    node === undefined
  );
}

const tags = new Proxy(
  {},
  {
    get(_, key: HTMLTagName) {
      return (first: any, ...c: BlazeNode[]) => {
        const isInput = key === "input";

        const props =
          isBlazeNode(first) && isInput
            ? first
            : !isBlazeNode(first)
              ? first
              : null;
        const children = isBlazeNode(first) && !isInput ? [first, ...c] : c;

        return createElement(key, props, ...children);
      };
    },
  },
) as {
  [key in HTMLTagName]: (
    props?: Partial<HTMLAttributes<key>> | null | BlazeNode,
    ...children: BlazeNode[]
  ) => BlazeElement<key, any>;
};

export { createElement as el, fragment, tags };
