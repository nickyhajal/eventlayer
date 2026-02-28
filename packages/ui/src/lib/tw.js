import { twMerge } from 'tailwind-merge'

export const tw = (...args) => twMerge(args.join(' '))

export const twSimple = (str) => {
  const heads = [
    'p',
    'w',
    'min-w',
    'h',
    'm',
    'bg',
    'fill',
    'z',
    'float',
    'items',
    'gap',
    'mx',
    'px',
    'my',
    'py',
    'duration',
    'tracking',
    'leading',
    'scale',
    'opacity',
    'rotate',
    'translate',
    'skew',
    'transition',
    'whitespace',
    'break',
    'align',
    'items',
    'ease',
    'delay',
    'animate',
    'table',
    'shadow',
    'rounded',
  ]
  const bits = str.split(' ')
  const vals = {}
  const final = bits.reduce((out, curr) => {
    const parts = curr.split('-')
    const head = parts[0]
    if (parts.length === 2 && heads.includes(head)) {
      vals[head] = parts[1]
    } else {
      out.push(curr)
    }
    return out
  }, [])
  return [...final, ...Object.entries(vals).map(([head, tail]) => `${head}-${tail}`)].join(' ')
}
