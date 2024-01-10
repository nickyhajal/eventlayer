import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'

export function transformDeep<T extends { [key: string]: any }>(
  obj: T,
  transformer: (value: any, key: string | number | symbol) => any
): T {
  const keys = Object.keys(obj) as (keyof T)[]
  keys.forEach((key) => {
    if (isArray(obj[key])) {
      obj[key] = obj[key].map((v: any) => transformDeep(v, transformer))
    } else if (isObject(obj[key])) {
      obj[key] = transformDeep(obj[key], transformer)
    } else if (!isFunction(obj[key])) {
      obj[key] = transformer(obj[key], key)
    }
  })
  return obj
}
