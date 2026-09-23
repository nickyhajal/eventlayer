// Converts a CSS color (#rgb, #rrggbb, #rrggbbaa, rrggbb, rgb()/rgba()) to "r g b" for rgb(var(--x))
export function getRawRgb(str: string) {
  if (typeof str !== 'string') return undefined
  const value = str.trim()
  if (value.startsWith('rgb')) {
    const parts = value
      .replace(/rgba?\(/, '')
      .replace(')', '')
      .split(/[\s,/]+/)
      .filter(Boolean)
    return parts.slice(0, 3).join(' ')
  }
  const hex = value.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return hexToRGB(hex.split('').map((c) => c + c).join(''))
  }
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
    return hexToRGB(hex.slice(0, 6))
  }
}
function hexToRGB(hex: string) {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}
