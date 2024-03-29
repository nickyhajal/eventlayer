import _ from 'lodash'
import { dayjs, formatMoney, type DayjsConfigType } from '@matterloop/util'

const {
	sortBy,
	reverse,
	shuffle,
	kebabCase,
	isArray,
	isNumber,
	isNaN,
	isNull,
	isUndefined,
	uniq,
	uniqBy,
	capitalize,
	set,
	merge,
	omit,
	clamp,
	get,
	pick
} = _
export {
	sortBy,
	reverse,
	shuffle,
	kebabCase,
	isArray,
	uniq,
	merge,
	clamp,
	omit,
	formatMoney,
	uniqBy,
	isNumber,
	isUndefined,
	isNaN,
	isNull,
	capitalize,
	set,
	get,
	pick
}

const w = typeof window !== 'undefined' ? window.innerWidth : 0
const h = typeof window !== 'undefined' ? window.innerHeight : 0
export const sizeFactor = w <= 1280 ? 14 / 16 : w <= 1440 || h < 798 ? 15 / 16 : 1

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

export function plural(value: any, singular: string, p?: string) {
	if (!p) p = `${singular}s`
	return +value === 1 ? singular : p
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
	'use strict'
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
			for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop ? prop + '.' + i : '' + i)
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
		delta: cur.diff(dateObj, 'days')
	}
}
