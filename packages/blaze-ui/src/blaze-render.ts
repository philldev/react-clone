import {
  isBlazeElement,
  isBlazeFragment,
  isBlazeTextNode,
  type BlazeElement,
  type BlazeFragment,
  type BlazeNode,
  type BlazeTextNode,
} from "./blaze-element";

export function render(node: BlazeNode, container: HTMLElement) {
  renderBlazeNode(node, container);
}

function renderBlazeElement(
  element: BlazeElement<any, any>,
  container: HTMLElement,
) {
  const domElement = document.createElement(
    element.type as keyof HTMLElementTagNameMap,
  );

  for (const [key, value] of Object.entries(element.props as any)) {
    if (key === "children") {
      if (Array.isArray(value)) {
        for (const child of value as BlazeNode[]) {
          renderBlazeNode(child, domElement);
        }
      } else {
        renderBlazeNode(value as BlazeNode, domElement);
      }
    } else if (key === "style") {
      if (typeof value === "object") {
        for (const [styleKey, styleValue] of Object.entries(
          value as CSSStyleDeclaration,
        )) {
          // @ts-ignore
          domElement.style[styleKey] = styleValue;
        }
      }
    } else if (key === "className") {
      domElement.className = value as string;
    } else if (key.startsWith("on")) {
      const eventName = key.slice(2).toLowerCase();
      const handler = value as EventListener;
      domElement.addEventListener(eventName, handler);
    } else if (key === "value" || key === "checked") {
      // @ts-ignore
      domElement[key] = value as string;
    } else {
      domElement.setAttribute(key, value as string);
    }
  }

  container.append(domElement);
}

function renderBlazeFragment(fragment: BlazeFragment, container: HTMLElement) {
  for (const child of fragment) {
    renderBlazeNode(child, container);
  }
}

function renderBlazeTextNode(textNode: BlazeTextNode, container: HTMLElement) {
  const domNode = document.createTextNode(textNode.toString());
  container.append(domNode);
}

function renderBlazeNode(node: BlazeNode, container: HTMLElement) {
  if (isBlazeTextNode(node)) {
    renderBlazeTextNode(node, container);
  } else if (isBlazeElement(node)) {
    renderBlazeElement(node, container);
  } else if (isBlazeFragment(node)) {
    renderBlazeFragment(node, container);
  } else {
    throw new Error(`Invalid node type: \n ${JSON.stringify(node)}`);
  }
}
