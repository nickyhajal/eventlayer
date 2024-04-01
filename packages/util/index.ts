import _ from 'lodash'
import { formatMoney } from './src/lib/formatMoney'
import { byKey } from './src/lib/byKey'
import { generateSha256, generateSha1 } from './src/lib/generateSha256'
export * from './src/lib/getMediaUrl'
export * from './src/lib/getContentFromContentArray'
export * from './src/lib/getEmbeddedYoutubeLinks'
export * from './src/lib/zodUtils'
export * from './src/lib/isIos'
export * from './src/lib/transformDeep'
export * from './src/lib/tw'
export * from './src/lib/secondsToStr'
export * from './src/lib/statusStrings'
export * from './src/lib/dispatch'
export * from './src/lib/transformDeep'
export * from './src/lib/plural'
export * from './src/lib/getId'
export * from './src/ExternalContent'
export * from './src/lib/makeCleanNumber'
export { default as uuid } from 'uuid'
export { default as v4 } from 'uuid/v4'
export {
  default as dayjs,
  relativeTime,
  relativeTimeShort,
  type DayjsConfigType,
} from './src/lib/dayjs'
import sortBy from 'lodash/sortBy'
import orderBy from 'lodash/orderBy'
import reverse from 'lodash/reverse'
import omitBy from 'lodash/omitBy'
import shuffle from 'lodash/shuffle'
import kebabCase from 'lodash/kebabCase'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import isNumber from 'lodash/isNumber'
import isNaN from 'lodash/isNaN'
import isNull from 'lodash/isNull'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import uniq from 'lodash/uniq'
import without from 'lodash/without'
import uniqBy from 'lodash/uniqBy'
import groupBy from 'lodash/groupBy'
import clone from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import capitalize from 'lodash/capitalize'
import set from 'lodash/set'
import some from 'lodash/some'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import clamp from 'lodash/clamp'
import get from 'lodash/get'
import pick from 'lodash/pick'
import debounce from 'lodash/debounce'
import dayjs from 'dayjs'
export {
  byKey,
  keyBy,
  orderBy,
  generateSha256,
  generateSha1,
  without,
  sortBy,
  clone,
  reverse,
  shuffle,
  kebabCase,
  groupBy,
  isArray,
  isString,
  uniq,
  merge,
  clamp,
  omit,
  omitBy,
  formatMoney,
  uniqBy,
  some,
  isNumber,
  isUndefined,
  isNaN,
  isNull,
  isObject,
  isFunction,
  capitalize,
  set,
  get,
  debounce,
  pick,
}
export const w = typeof window !== 'undefined' ? window.innerWidth : 0
const h = typeof window !== 'undefined' ? window.innerHeight : 0
export const sizeFactor =
  w <= 1280 ? 14 / 16 : w <= 1440 || h < 798 ? 15 / 16 : 1

interface IParam {
  pre?: Function
  post?: Function
  flat?: boolean
}
export const arrangeByKey = (
  collection: any,
  key: string,
  { pre, post, flat = false }: IParam = {}
) => {
  return (collection || []).reduce((out: any, curr: any) => {
    if (pre) {
      ;[out, curr] = pre(out, curr)
    }
    if (flat) {
      out[curr[key]] = curr
    } else {
      if (!out[curr[key]]) out[curr[key]] = []
      out[curr[key]].push(curr)
    }
    if (post) {
      out = post(out, curr, key)
    }
    return out
  }, {})
}

export const ordinal = (i: number) => {
  var j = i % 10,
    k = i % 100
  if (j == 1 && k != 11) {
    return i + 'st'
  }
  if (j == 2 && k != 12) {
    return i + 'nd'
  }
  if (j == 3 && k != 13) {
    return i + 'rd'
  }
  return i + 'th'
}

export const unflatten = function (data: any) {
  if (Object(data) !== data || Array.isArray(data)) return data
  var result: any = {},
    cur: any,
    prop: string,
    idx: number,
    last: number,
    temp: string
  for (var p in data) {
    ;(cur = result), (prop = ''), (last = 0)
    do {
      idx = p.indexOf('.', last)
      temp = p.substring(last, idx !== -1 ? idx : undefined)
      cur = cur[prop] || (cur[prop] = !isNaN(parseInt(temp)) ? [] : {})
      prop = temp
      last = idx + 1
    } while (idx >= 0)
    cur[prop] = data[p]
  }
  return result['']
}
export const flatten = function (data: any, ignore: string[] = []) {
  var result: any = {}
  function recurse(cur: any, prop: string) {
    if (Object(cur) !== cur || ignore.includes(prop)) {
      result[prop] = cur
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop ? prop + '.' + i : '' + i)
      if (l == 0) result[prop] = []
    } else {
      var isEmpty = true
      for (var p in cur) {
        isEmpty = false
        recurse(cur[p], prop ? prop + '.' + p : p)
      }
      if (isEmpty) result[prop] = {}
    }
  }
  recurse(data, '')
  return result
}

export const offset = (el: HTMLElement) => {
  var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

export const formatDate = (date: DayjsConfigType) => {
  const dateObj = dayjs(date)
  const cur = dayjs()

  return {
    m: dateObj.format('MMM'),
    d: dateObj.format('DD'),
    y: dateObj.format('YYYY'),
    delta: cur.diff(dateObj, 'days'),
  }
}
