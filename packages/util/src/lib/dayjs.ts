import dayjs from 'dayjs'
import type { ConfigType as DayjsConfigType } from 'dayjs'
import RelativeTime from 'dayjs/plugin/relativeTime.js'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
dayjs.extend(RelativeTime)
dayjs.extend(advancedFormat)

const formats = {
  short: 'YYYY-MM-DD',
  full: 'YYYY-MM-DD HH:mm:ss',
  us: 'MM/DD/YYYY',
  euro: 'DD/MM/YYYY',
  humanFull: 'MMMM Do YYYY, h:mm:ss a',
  humanShort: 'Do' 
}

export default dayjs
export type { DayjsConfigType }
export function relativeTime(timeStr: DayjsConfigType) {
  return dayjs(timeStr).fromNow()
  // .replace("an", "1")
  // .replace("a minute", "1m")
  // .replace("a few seconds", "just now")
  // .replace(" seconds", "s")
  // .replace(" second", "s")
  // .replace(" days", "d")
  // .replace(" day", "d")
  // .replace(" years", "y")
  // .replace(" year", "y")
  // .replace(" minutes", "m")
  // .replace(" minute", "m")
  // .replace(" hours", "h")
  // .replace(" hour", "h")
}
export function today(key: keyof typeof formats = 'short') {
  return dayjs().format(formats[key] || key)
}
export function relativeTimeMed(timeStr: DayjsConfigType) {
  return dayjs(timeStr)
    .fromNow()
    .replace('an', '1')
    .replace('a minute', '1m')
    .replace('in a few seconds', 'now')
    .replace('a few seconds ago', 'just now')
    .replace(' seconds', 's')
    .replace('a second', 's')
    .replace(' days', 'd')
    .replace('a day', '1d')
    .replace(' day', 'd')
    .replace(' years', 'y')
    .replace('a year', 'y')
    .replace(' minutes', 'm')
    .replace('a minute', 'm')
    .replace(' hours', 'h')
    .replace('a hour', 'h')
}
export function relativeTimeShort(timeStr: DayjsConfigType) {
  return dayjs(timeStr)
    .fromNow(true)
    .replace('an', '1')
    .replace('a minute', '1m')
    .replace('in a few seconds', 'now')
    .replace('a few seconds ago', 'just now')
    .replace(' seconds', 's')
    .replace('a second', 's')
    .replace(' days', 'd')
    .replace('a day', '1d')
    .replace(' day', 'd')
    .replace(' years', 'y')
    .replace('a year', 'y')
    .replace(' minutes', 'm')
    .replace('a minute', 'm')
    .replace(' hours', 'h')
    .replace('a hour', 'h')
}
