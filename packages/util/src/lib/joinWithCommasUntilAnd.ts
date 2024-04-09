export function joinWithCommasUntilAnd(elements: string[]): string {
  if (elements.length === 0) {
    return '';
  } else if (elements.length === 1) {
    return elements[0];
  } else {
    const allButLast = elements.slice(0, -1).join(', ');
    const lastElement = elements[elements.length - 1];
    return `${allButLast} and ${lastElement}`;
  }
}