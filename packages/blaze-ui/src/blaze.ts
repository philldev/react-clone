type BlazeElement = {
  type: HTMLElementTagName;
  props: Props;
};
type BlazeNode = BlazeElement | string | number;
type HTMLElementTagName = keyof HTMLElementTagNameMap;
type HTMLAttributes<T extends HTMLElementTagName> = Partial<
  Omit<HTMLElementTagNameMap[T], "children">
>;

type Props = {
  [key: string]: any;
  children?: BlazeNode[] | BlazeNode;
};

type HtmlElementProps<T extends HTMLElementTagName> = Props & HTMLAttributes<T>;

export function createElement<T extends HTMLElementTagName>(
  tag: T,
  props: HtmlElementProps<T>,
  children: BlazeNode | BlazeNode[] = [],
): BlazeElement {
  if (Array.isArray(children)) {
    props.children = children;
  } else {
    props.children = [children];
  }

  return {
    type: tag,
    props,
  };
}

function createDomFromNode(node: BlazeNode): Node {
  if (typeof node === "string") {
    return document.createTextNode(node);
  }
  if (typeof node === "number") {
    return document.createTextNode(node.toString());
  }
  if (Array.isArray(node)) {
    return node
      .map(createDomFromNode)
      .reduce((acc, node) => acc.appendChild(node));
  }

  const domEl = document.createElement(node.type);

  for (const [key, value] of Object.entries(node.props)) {
    switch (key) {
      case "children":
        if (Array.isArray(value)) {
          value.forEach((child) => domEl.appendChild(createDomFromNode(child)));
        } else {
          domEl.appendChild(createDomFromNode(value));
        }
        break;
      default:
        if (value === true) {
          domEl.setAttribute(key, "");
        } else if (key.startsWith("on")) {
          domEl.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          domEl.setAttribute(key, value);
        }
    }
    console.log(domEl);
  }
  return domEl;
}

export function render(node: BlazeNode, container: HTMLElement) {
  const dom = createDomFromNode(node);
  container.appendChild(dom);
}
