import {
  isBlazeComponent,
  isBlazeElement,
  isBlazeFragment,
  isBlazeNode,
  isBlazeNullNode,
  isBlazeTextNode,
  type BlazeComponent,
  type BlazeElement,
  type BlazeFragment,
  type BlazeNode,
  type BlazeTextNode,
} from "./blaze-element";
import { arraysAreEqual, compareProps } from "./utils";

// let _currentContainer: HTMLElement | null = null;
// let _currentNode: BlazeNode | null = null;
// let _mounted = false;

export function render(node: BlazeNode, container: HTMLElement) {
  // _currentContainer = container;
  // _currentNode = node;
  const dom = createBlazeNodeDom(node, container);
  if (dom === null) {
    return;
  }
  container.append(dom);
  // _mounted = true;
}

function createBlazeNodeDom(
  node: BlazeNode,
  container: HTMLElement,
  index: number = 0,
): Node | null {
  if (isBlazeTextNode(node)) {
    return createBlazeTextNodeDom(node);
  } else if (isBlazeElement(node)) {
    return createBlazeElementDom(node);
  } else if (isBlazeComponent(node)) {
    return createBlazeComponentDom(node, container, index);
  } else if (isBlazeFragment(node)) {
    return createBlazeFragmentDom(node, container, index);
  } else if (isBlazeNullNode(node)) {
    return null;
  } else {
    throw new Error(`Invalid node type: \n ${JSON.stringify(node)}`);
  }
}

function createBlazeTextNodeDom(textNode: BlazeTextNode) {
  return document.createTextNode(textNode.toString());
}

function createBlazeFragmentDom(
  fragment: BlazeFragment,
  container: HTMLElement,
  index: number = 0,
) {
  const domFragment = document.createDocumentFragment();
  for (let i = 0; i < fragment.length; i++) {
    const child = fragment[i];
    const dom = createBlazeNodeDom(child, container, i + index);
    if (dom === null) {
      continue;
    }
    domFragment.append(dom);
  }

  return domFragment;
}

function createBlazeComponentDom(
  node: BlazeElement<BlazeComponent<any>, any>,
  container: HTMLElement,
  index: number,
) {
  node.__domIndex = index;
  const snapshots = renderComponent(node, container);
  return createBlazeNodeDom(snapshots, container);
}

let currentComponentNode: BlazeElement<BlazeComponent<any>, any> | null = null;
let currentHookIndex = 0;

export function getCurrentComponentNode() {
  return currentComponentNode;
}

export function getCurrentHookIndex() {
  return currentHookIndex;
}

export function incrementCurrentHookIndex() {
  currentHookIndex++;
}

function renderComponent(
  node: BlazeElement<BlazeComponent<any>, any>,
  container: HTMLElement,
) {
  currentHookIndex = 0;
  currentComponentNode = node;

  if (node.__hooks === undefined) {
    node.__hooks = [];
  }

  const Component = node.type;
  const props = node.props;
  const snapshots = Component(props);

  node.__componentChildrenSnapshot = snapshots;
  node.__componentContainer = container;

  return snapshots;
}

export function tryRerenderComponent(
  node: BlazeElement<BlazeComponent<any>, any>,
) {
  const hooks = node.__hooks!;
  const container = node.__componentContainer!;

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    if (hook.value !== hook.prevValue) {
      const oldSnapshots = node.__componentChildrenSnapshot;
      const snapshots = renderComponent(node, container);
      update(oldSnapshots, snapshots, container, node.__domIndex!);
      return;
    }
  }
}

function createBlazeElementDom(element: BlazeElement<any, any>) {
  const domElement = document.createElement(
    element.type as keyof HTMLElementTagNameMap,
  );

  for (const [key, value] of Object.entries(element.props as any)) {
    if (key === "children") {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const child = value[i];
          const dom = createBlazeNodeDom(child, domElement, i);
          if (dom === null) {
            continue;
          }
          domElement.append(dom);
        }
      } else {
        const dom = createBlazeNodeDom(value as BlazeNode, domElement);
        if (dom === null) {
          continue;
        }
        domElement.append(dom);
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

  return domElement;
}

function appendBlazeNodeDom(node: BlazeNode, parent: HTMLElement) {
  const dom = createBlazeNodeDom(node, parent);
  if (dom !== null) parent.append(dom);
}

function removeBlazeNodeDom(nodeIndex: number, parent: HTMLElement) {
  parent.removeChild(parent.childNodes[nodeIndex]);
}

function replaceBlazeNodeDom(
  nodeIndex: number,
  newNode: BlazeNode,
  parent: HTMLElement,
) {
  const newDom = createBlazeNodeDom(newNode, parent);
  if (newDom !== null) {
    parent.replaceChild(newDom, parent.childNodes[nodeIndex]);
  }
}

function update(
  oldNode: BlazeNode,
  newNode: BlazeNode,
  parent: HTMLElement,
  index: number = 0,
  depth: number = 0,
  lastFragmentLength: number = 0,
) {
  const nodeDomIndex = index + lastFragmentLength;

  if (isDifferentNode(oldNode, newNode)) {
    if (isBlazeNullNode(oldNode)) {
      appendBlazeNodeDom(newNode, parent);
    } else if (isBlazeNullNode(newNode)) {
      removeBlazeNodeDom(nodeDomIndex, parent);
    } else if (isBlazeFragment(oldNode)) {
      removeFragmentChildren(oldNode, parent, nodeDomIndex);
      appendBlazeNodeDom(newNode, parent);
    } else {
      replaceBlazeNodeDom(nodeDomIndex, newNode, parent);
    }
    return;
  }

  if (isBlazeComponent(newNode) && isBlazeComponent(oldNode)) {
    const newProps = newNode.props;
    const oldProps = oldNode.props;

    let propsChanged = compareProps(oldProps, newProps);

    if (propsChanged) {
      const newSnapshots = renderComponent(newNode, parent);
      const oldSnapshots = oldNode.__componentChildrenSnapshot;

      update(
        oldSnapshots,
        newSnapshots,
        parent,
        index,
        depth,
        lastFragmentLength,
      );
    }
  }

  if (isBlazeTextNode(newNode) && isBlazeTextNode(oldNode)) {
    if (newNode.toString() !== oldNode.toString()) {
      parent.childNodes[nodeDomIndex].textContent = newNode.toString();
    }
    return;
  }

  if (isBlazeFragment(newNode) && isBlazeFragment(oldNode)) {
    const maxLength = Math.max(oldNode.length, newNode.length);
    let fragmentLength = 0;

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldNode[i];
      const newChild = newNode[i];

      if (isBlazeFragment(newChild)) {
        // @ts-ignore - this is a hack to get the length of the fragment
        fragmentLength += newChild.flat(Infinity).length;
      }

      update(oldChild, newChild, parent, index + depth + i, depth + 1);
    }
    return;
  }

  if (isBlazeElement(newNode) && isBlazeElement(oldNode)) {
    const currentEl = parent.childNodes[index] as HTMLElement;
    if (newNode.type !== oldNode.type) {
      const newEl = createBlazeElementDom(newNode);
      parent.replaceChild(newEl, currentEl);
    } else {
      updateElementProps(oldNode, newNode, currentEl);
    }
  }
}

function removeFragmentChildren(
  fragment: BlazeFragment,
  parent: HTMLElement,
  startIndex: number,
) {
  for (let i = 0; i < fragment.length; i++) {
    removeBlazeNodeDom(startIndex + i, parent);
  }
}

function updateElementProps(
  oldNode: BlazeElement<any, any>,
  newNode: BlazeElement<any, any>,
  currentEl: HTMLElement,
) {
  for (const [key, newValue] of Object.entries(
    newNode.props as Record<string, any>,
  )) {
    const oldValue = oldNode.props[key];

    if (key === "children") {
      updateChildren(oldNode, newNode, currentEl);
    } else if (key === "style") {
      updateStyle(oldValue, newValue as CSSStyleDeclaration, currentEl);
    } else if (key === "className" && oldValue !== newValue) {
      currentEl.className = newValue as string;
    } else if (key.startsWith("on")) {
      updateEventListener(key, oldValue, newValue as EventListener, currentEl);
    } else if (
      (key === "value" || key === "checked") &&
      oldValue !== newValue
    ) {
      // @ts-ignore - this is a hack to get the value of the element
      currentEl[key] = newValue;
    } else if (oldValue !== newValue) {
      currentEl.setAttribute(key, newValue);
    }
  }
}

function updateChildren(
  oldNode: BlazeElement<any, any>,
  newNode: BlazeElement<any, any>,
  currentEl: HTMLElement,
) {
  const oldChildren = Array.isArray(oldNode.props.children)
    ? oldNode.props.children
    : [oldNode.props.children];
  const newChildren = Array.isArray(newNode.props.children)
    ? newNode.props.children
    : [newNode.props.children];

  if (!arraysAreEqual(oldChildren, newChildren)) {
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    let fragmentLength = 0;

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];

      if (isBlazeFragment(newChild)) {
        // @ts-ignore - this is a hack to get the length of the fragment
        fragmentLength += newChild.flat(Infinity).length;
      }

      update(oldChild, newChild, currentEl, i, 0, fragmentLength);
    }
  }
}

function updateStyle(
  oldStyle: CSSStyleDeclaration,
  newStyle: CSSStyleDeclaration,
  currentEl: HTMLElement,
) {
  for (const [styleKey, styleValue] of Object.entries(newStyle)) {
    // @ts-ignore
    if (oldStyle[styleKey] !== styleValue) {
      // @ts-ignore
      currentEl.style[styleKey] = styleValue;
    }
  }
}

function updateEventListener(
  key: string,
  oldHandler: EventListener,
  newHandler: EventListener,
  currentEl: HTMLElement,
) {
  const eventName = key.slice(2).toLowerCase();
  currentEl.removeEventListener(eventName, oldHandler);
  currentEl.addEventListener(eventName, newHandler);
}

function isDifferentNode(oldNode: BlazeNode, newNode: BlazeNode) {
  return (
    (isBlazeTextNode(newNode) && !isBlazeTextNode(oldNode)) ||
    (isBlazeFragment(newNode) && !isBlazeFragment(oldNode)) ||
    (isBlazeElement(newNode) && !isBlazeElement(oldNode)) ||
    (isBlazeNullNode(newNode) && !isBlazeNullNode(oldNode))
  );
}
