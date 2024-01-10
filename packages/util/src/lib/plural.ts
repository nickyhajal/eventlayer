export function plural(value: any, singular: string, p?: string) {
  if (!p) p = `${singular}s`
  return +value === 1 ? singular : p
}
