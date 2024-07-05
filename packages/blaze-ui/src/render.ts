import { createDomElementFromNode, update } from "./dom";
import type { BlazeNode } from "./element";
import { resetIndex } from "./hooks";

let mounted = false;
let currentContainer: HTMLElement | null = null;
let currentNode: BlazeNode | null = null;

export function getCurrentContainer() {
  return currentContainer;
}

export function getCurrentNode() {
  return currentNode;
}

export function render(node: BlazeNode, container: HTMLElement) {
  resetIndex();
  currentContainer = container;
  currentNode = node;
  if (!mounted) {
    const domElement = createDomElementFromNode(node);
    if (domElement === null) {
      return;
    }
    container.append(domElement);
    mounted = true;
  } else {
    update(currentNode, node, container, 0);
  }
}
