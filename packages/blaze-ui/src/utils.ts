export function arraysAreEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

export function compareProps(oldProps: any, newProps: any) {
  for (const [key, value] of Object.entries(newProps)) {
    if (key === "children") {
      continue;
    }
    if (value !== oldProps[key]) {
      return true;
    }
  }

  return false;
}
