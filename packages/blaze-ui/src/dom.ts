import type {
  BlazeComponent,
  BlazeElement,
  BlazeFragment,
  BlazeNode,
  HTMLAttributes,
} from "./element";
import { isBlazeElement, isDifferentType, isHTMLElement } from "./utils";

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
        domElement.append(childNode);
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
) {
  const comp = node.type;
  const compNodes = comp(node.props);

  node.__nodeSnapshots = compNodes;

  return createDomElementFromNode(compNodes);
}

function createDomElementFromFragment(fragment: BlazeFragment) {
  const domElement = document.createDocumentFragment();

  for (const child of fragment) {
    const childNode = createDomElementFromNode(child);
    if (childNode === null) {
      continue;
    }
    domElement.append(childNode);
  }

  return domElement;
}

function createDomElementFromNode(node: BlazeNode): Node | null {
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

  if (Array.isArray(node)) {
    return createDomElementFromFragment(node as BlazeFragment);
  }

  throw new Error(`Invalid node type: \n ${JSON.stringify(node)}`);
}

function updateDomElementProps(
  domElement: Element,
  currentProps: HTMLAttributes<any>,
  newProps: HTMLAttributes<any>,
) {
  for (const [key, value] of Object.entries(currentProps)) {
    if (newProps[key] === undefined) {
      domElement.removeAttribute(key);
      continue;
    }

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
  container: Node | DocumentFragment,
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
        const newComp = newElement.type as BlazeComponent<any>;

        const currentCompNode = currentElement.__nodeSnapshots;

        const newCompNode = newComp(newElement.props);
        newElement.__nodeSnapshots = newCompNode;

        update(currentCompNode, newCompNode, parent, index);

        return;
      }
    }
  }

  if (Array.isArray(currentNode) && Array.isArray(newNode)) {
    const currentFragment = currentNode as BlazeFragment;
    const newFragment = newNode as BlazeFragment;

    const maxLength = Math.max(currentFragment.length, newFragment.length);

    for (let i = 0; i < maxLength; i++) {
      const currentChild = currentFragment[i];
      const newChild = newFragment[i];
      update(currentChild, newChild, parent, i);
    }

    return;
  }

  if (!Object.is(currentNode, newNode)) {
    replaceDomNode(newNode, parent, index);
    return;
  }
}

export { update, createDomElementFromNode };
