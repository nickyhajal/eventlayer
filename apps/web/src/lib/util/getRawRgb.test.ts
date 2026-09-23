import { expect, test } from 'vitest'
import { getRawRgb } from './getRawRgb'
test('rgb', () => {
  expect(getRawRgb('#212540')).toBe('33 37 64')
  expect(getRawRgb(' 212540 ')).toBe('33 37 64')
  expect(getRawRgb('#21254080')).toBe('33 37 64')
  expect(getRawRgb('#fff')).toBe('255 255 255')
  expect(getRawRgb('rgba(1, 2, 3, 0.5)')).toBe('1 2 3')
  expect(getRawRgb('rgb(1 2 3)')).toBe('1 2 3')
  expect(getRawRgb('nope')).toBeUndefined()
})
