export function makeCleanNumber(input: string | number) {
  // Remove all non-numeric characters except for '.'
  let result = `${input}`.replace(/[^0-9.]/g, '');

  // Split the string at '.' and rejoin with only one '.'
  const parts = result.split('.');
  if (parts.length > 2) {
      result = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  return result;
}