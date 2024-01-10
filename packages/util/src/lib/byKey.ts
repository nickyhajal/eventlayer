import _ from 'lodash'

interface IListOpts<T> {
  pre?: (
    out: { [key: string]: Array<T> },
    curr: T
  ) => [{ [key: string]: Array<T> }, T]
  post?: (
    out: { [key: string]: Array<T> },
    curr: T
  ) => { [key: string]: Array<T> }
  // flat?: boolean
}
export const listByKey = <T>(
  key: keyof T,
  collection: Array<T>,
  { pre, post }: IListOpts<T> = {}
): { [key: string]: Array<T> } => {
  return (collection || []).reduce((out, curr) => {
    const currKey = key as keyof typeof curr
    const id = curr[currKey]
    if (id && typeof id === 'string') {
      if (pre) {
        ;[out, curr] = pre(out, curr)
      }
      if (!out[id]) out[id] = []
      out[id].push(curr)
      if (post) {
        out = post(out, curr)
      }
    }
    return out
  }, {} as { [key: string]: Array<T> })
}

interface IByKeyOpts<T> {
  merge?: Partial<T>
  pre?: (out: { [key: string]: T }, curr: T) => [{ [key: string]: T }, T]
  post?: (out: { [key: string]: T }, curr: T) => { [key: string]: T }
}
export const byKey = <T>(
  key: keyof T,
  collection: Array<T>,
  { merge, pre, post }: IByKeyOpts<T> = {}
): { [key: string]: T } => {
  return (collection || []).reduce((out, curr) => {
    const currKey = key as keyof typeof curr
    const id = curr[currKey]
    if (id && typeof id === 'string') {
      if (pre) {
        ;[out, curr] = pre(out, curr)
      }
      if (merge) {
        _.merge(curr, merge)
      }
      out[id] = curr
    }
    return out
  }, {} as { [key: string]: T })
}
