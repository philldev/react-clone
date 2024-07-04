interface BlazeComponent<P> {
  (props: P): BlazeNode;
  __renderedNode?: BlazeNode;
}

interface BlazeElement<
  P = any,
  T extends string | BlazeComponent<any> = string | BlazeComponent<any>,
> {
  type: T;
  props: P;
}

type BlazeText = string | number;
type BlazeChild = BlazeElement | BlazeText;
type BlazeNode = BlazeChild | boolean | null | undefined;

export type { BlazeComponent, BlazeElement, BlazeNode };

type HTMLAttributes<T extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[T], "children" | "style">
> & {
  children?: BlazeNode[];
  style?: Partial<CSSStyleDeclaration>;
};

function createElement<T extends keyof HTMLElementTagNameMap>(
  type: T,
  props: HTMLAttributes<T>,
  ...children: BlazeNode[]
): BlazeElement<any, T>;
function createElement<T extends BlazeComponent<any>>(
  type: T,
  props: any,
  ...children: BlazeNode[]
): BlazeElement<any, T>;
function createElement<
  T extends keyof HTMLElementTagNameMap | BlazeComponent<any>,
>(type: T, props: any, ...children: BlazeNode[]): BlazeElement<any, T> {
  props.children = children;
  return {
    type,
    props,
  };
}

function createDomElementFromElement(
  element: BlazeElement<any, any>,
): HTMLElement {
  const domElement = document.createElement(
    element.type as keyof HTMLElementTagNameMap,
  );

  for (const [key, value] of Object.entries(element.props)) {
    if (key === "children") {
      for (const child of value as BlazeNode[]) {
        const childNode = createDomElementFromNode(child);
        if (childNode === null) {
          continue;
        }
        domElement.appendChild(childNode);
      }
      continue;
    }

    if (key === "style") {
      for (const [styleKey, styleValue] of Object.entries(
        value as CSSStyleDeclaration,
      )) {
        // @ts-ignore
        domElement.style[styleKey] = styleValue;
      }
      continue;
    }

    if (key === "className") {
      domElement.className = value as string;
      continue;
    }

    if (key.startsWith("on")) {
      const eventName = key.slice(2).toLowerCase();
      const handler = value as EventListener;

      domElement.addEventListener(eventName, handler);

      continue;
    }

    if (key === "value" || key === "checked") {
      // @ts-ignore
      domElement[key] = value as string;
      continue;
    }

    domElement.setAttribute(key, value as string);
  }

  return domElement;
}

function createDomElementFromComponent(
  node: BlazeElement<any, BlazeComponent<any>>,
): HTMLElement | Text | Comment | null {
  const comp = node.type;
  const compNodes = comp(node.props);
  comp.__renderedNode = compNodes;

  return createDomElementFromNode(compNodes);
}

function createDomElementFromNode(
  node: BlazeNode,
): HTMLElement | Text | Comment | null {
  if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "boolean"
  ) {
    return document.createTextNode(node.toString());
  }

  if (node === null || node === undefined) {
    return null;
  }

  if (typeof node === "object" && "type" in node) {
    switch (typeof node.type) {
      case "string":
        return createDomElementFromElement(node);
      case "function":
        // @ts-ignore
        return createDomElementFromComponent(node);
      default:
        throw new Error(`Invalid node type: \n ${JSON.stringify(node)}`);
    }
  }

  throw new Error(`Invalid node type: \n ${JSON.stringify(node)}`);
}

let mounted = false;
let currentContainer: HTMLElement | null = null;
let currentNode: BlazeNode | null = null;
let hooks: any[] = [];
let hooksIndex = 0;

function render(node: BlazeNode, container: HTMLElement) {
  hooksIndex = 0;
  currentContainer = container;
  currentNode = node;
  if (!mounted) {
    const domElement = createDomElementFromNode(node);
    if (domElement === null) {
      return;
    }
    container.appendChild(domElement);
    mounted = true;
  } else {
    update(currentNode, node, container, 0);
  }
}

function update(
  currentNode: BlazeNode,
  newNode: BlazeNode,
  parent: Node,
  index: number = 0,
): void {
  if (isDifferentType(currentNode, newNode)) {
    replaceDomNode(newNode, parent, index);
    return;
  }

  if (isBlazeElement(currentNode) && isBlazeElement(newNode)) {
    const currentElement = currentNode as BlazeElement<any, any>;
    const newElement = newNode as BlazeElement<any, any>;

    if (typeof currentElement.type !== typeof newElement.type) {
      replaceDomNode(newNode, parent, index);
      return;
    } else {
      if (typeof currentElement.type === "string") {
        if (currentElement.type !== newElement.type) {
          replaceDomNode(newNode, parent, index);
          return;
        }

        const currentDomElement = parent.childNodes[index] as Element;
        const currentProps = currentElement.props;
        const newProps = newElement.props;

        updateDomElementProps(currentDomElement, currentProps, newProps);

        return;
      } else if (typeof currentElement.type === "function") {
        const currentComp = currentElement.type as BlazeComponent<any>;
        const newComp = newElement.type as BlazeComponent<any>;

        const currentCompNode = Object.assign({}, currentComp.__renderedNode);

        const newCompNode = newComp(newElement.props);
        newComp.__renderedNode = newCompNode;

        update(currentCompNode, newCompNode, parent);

        return;
      }
    }
  }

  if (!Object.is(currentNode, newNode)) {
    replaceDomNode(newNode, parent, index);
    return;
  }
}

function updateDomElementProps(
  domElement: Element,
  currentProps: HTMLAttributes<any>,
  newProps: HTMLAttributes<any>,
) {
  for (const [key, value] of Object.entries(currentProps)) {
    switch (key) {
      case "children":
        const currentChildren = currentProps.children as BlazeNode[];
        const newChildren = newProps.children as BlazeNode[];

        let maxLength = Math.max(currentChildren.length, newChildren.length);

        for (let i = 0; i < maxLength; i++) {
          const currentChild = currentChildren[i];
          const newChild = newChildren[i];
          update(currentChild, newChild, domElement, i);
        }

        break;
      case "style":
        if (!isHTMLElement(domElement)) {
          continue;
        }

        const currentStyle = currentProps.style as CSSStyleDeclaration;
        const newStyle = newProps.style as CSSStyleDeclaration;

        for (const [styleKey, styleValue] of Object.entries(currentStyle)) {
          // @ts-ignore
          if (styleValue !== newStyle[styleKey]) {
            // @ts-ignore
            domElement.style[styleKey] = styleValue;
          }
        }

        break;
      case "className":
        if (!isHTMLElement(domElement)) {
          continue;
        }

        if (currentProps.className !== newProps.className) {
          domElement.className = newProps.className;
        }

        break;
      default:
        if (key.startsWith("on")) {
          const eventName = key.slice(2).toLowerCase();
          const currentHandler = currentProps[key] as EventListener;
          const newHandler = newProps[key] as EventListener;

          domElement.removeEventListener(eventName, currentHandler);
          domElement.addEventListener(eventName, newHandler);
          continue;
        }

        if (value !== newProps[key]) {
          if (key === "value" || key === "checked") {
            //@ts-ignore
            domElement[key] = newProps[key];

            continue;
          }

          domElement.setAttribute(key, newProps[key]);
        }
    }
  }
}

function replaceDomNode(
  newNode: BlazeNode,
  container: Node,
  index: number = 0,
) {
  const currentDomElement = container.childNodes[index];

  if (!currentDomElement) {
    const newDomElement = createDomElementFromNode(newNode);

    if (newDomElement) {
      container.appendChild(newDomElement);
    }
  } else {
    const newDomElement = createDomElementFromNode(newNode);

    if (newDomElement) {
      container.replaceChild(newDomElement, currentDomElement);
    } else {
      container.removeChild(currentDomElement);
    }
  }
}

function isDifferentType(currentNode: BlazeNode, newNode: BlazeNode): boolean {
  return typeof currentNode !== typeof newNode;
}

function isBlazeElement(node: BlazeNode): node is BlazeElement<any, any> {
  return node !== null && typeof node === "object" && "type" in node;
}

function isHTMLElement(el: any): el is HTMLElement {
  return el instanceof HTMLElement;
}

function useState<T>(initialState: T) {
  const localStateIndex = hooksIndex;
  hooksIndex++;

  if (hooks[localStateIndex] === undefined) {
    hooks[localStateIndex] = initialState;
  }

  function setState(newState: T | ((state: T) => T)): void {
    if (typeof newState === "function") {
      // @ts-ignore
      hooks[localStateIndex] = newState(hooks[localStateIndex]);
    } else {
      hooks[localStateIndex] = newState;
    }

    render(currentNode!, currentContainer!);
  }

  return [hooks[localStateIndex] as T, setState] as const;
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

export { createElement as el, render, useState, useEffect };
