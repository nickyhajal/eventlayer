import { plural } from './plural'

export function secondsToTimeParts(seconds: number) {
  const d = Math.floor(seconds / (60 * 60 * 24))
  const h = Math.floor(seconds / (60 * 60))
  const m = Math.floor((seconds % (60 * 60)) / 60)
  const s = Math.floor(seconds % 60)
  return { d, h, m, s }
}
export function secondsToSimpleTimeStr(seconds: number) {
  const { d, h, m, s } = secondsToTimeParts(seconds)
  if (d) {
    return `${d} ${plural(d, 'day')}`
  } else if (h) {
    return `${h} ${plural(h, 'hour')}`
  } else if (m) {
    return `${m} ${plural(m, 'minute')}`
  } else if (s) {
    return `${s} ${plural(s, 'second')}`
  }
}
export function secondsToDueStr(seconds: number) {
  const str = secondsToSimpleTimeStr(Math.abs(seconds))
  if (seconds < 0) {
    return `${str} late`
  } else {
    return `Due in ${str}`
  }
}

type Separator = {
  separator: ':' | 'abbr'
}
type Section = 'h' | 'm' | 's'
export function secondsToStr(seconds: number, { separator }: Separator = { separator: ':' }) {
  const { h, m, s } = secondsToTimeParts(seconds)
  new Date()
  function getSeparator(section: Section) {
    const separators = {
      ':': {
        h: ':',
        m: ':',
        s: '',
      },
      abbr: {
        h: 'h ',
        m: 'm ',
        s: 's ',
      },
    }
    return separators[separator][section]
  }

  return `${h > 0 ? `${h}${getSeparator('h')}` : ''}${
    m > 0 ? (m < 10 && h > 0 ? `0${m}` : m) : h > 0 ? '00' : '0'
  }${getSeparator('m')}${s > 0 ? (s < 10 ? `0${s}` : s) : '00'}${getSeparator('s')}`.trim()
}
