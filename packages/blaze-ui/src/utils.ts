import type { BlazeElement, BlazeNode } from "./element";

export function isDifferentType(
  currentNode: BlazeNode,
  newNode: BlazeNode,
): boolean {
  return typeof currentNode !== typeof newNode;
}

export function isBlazeElement(
  node: BlazeNode,
): node is BlazeElement<any, any> {
  return (
    node !== null &&
    typeof node === "object" &&
    "type" in node &&
    !Array.isArray(node)
  );
}

export function isHTMLElement(el: any): el is HTMLElement {
  return el instanceof HTMLElement;
}
