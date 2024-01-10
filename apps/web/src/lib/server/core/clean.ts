export function clean<T>(item: T): T {
  if (Array.isArray(item)) {
    return item.map((i) => clean(i)) as T
  } else if (item && typeof item === 'object') {
    return Object.entries(item)
      .map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ])
      .filter(
        ([key, value]) => typeof value !== 'function' || value instanceof Date
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: clean(value) }), {} as T)
  } else {
    return item
  }
}

export async function awaitClean<T>(
  promise: Promise<T>,
  verify?: (obj: T) => boolean
): Promise<T> {
  const item = await promise
  const result = clean(item)
  if (!verify || verify(result as any)) {
    return result as T
  }
  throw new Error(`You don't have permission to view this resource.`)
}

export async function awaitCleanList<T>(
  promise: Promise<T[]>,
  verify?: (obj: T[]) => boolean
): Promise<T[]> {
  const item = await promise
  const result = clean(item)
  if (!verify || verify(result as any)) {
    return result
  }
  throw new Error(`You don't have permission to view this resource.`)
}
