import { browser } from '$app/environment'
import type { Writable } from 'svelte/store'

import { clone } from '@matterloop/util'

interface SaverOptions {
  omitObjects: boolean
  onSuccess: () => void
}

export function makeSaver<TObj extends { [key: string]: any }, TStore extends Writable<TObj>>(
  store: TStore,
  procedure: (input: Partial<TObj>) => any,
  options: SaverOptions = { omitObjects: true, onSuccess: () => {} },
) {
  let timo = setTimeout(() => {}, 0)
  let lastSave: TObj
  const { omitObjects, onSuccess } = options
  let unsubscribe = store.subscribe((current) => {
    if (browser) {
      if (!lastSave) lastSave = clone(current)
      else update(current, onSuccess)
    }
  })
  function getDiff(current: TObj) {
    return Object.entries(current).reduce((acc, [key, value]) => {
      if (
        (value !== lastSave[key] || key === 'id') &&
        (!omitObjects || (omitObjects && typeof value !== 'object'))
      ) {
        acc[key as keyof TObj] = value
      }
      return acc
    }, {} as TObj)
  }
  function update(current: TObj, onSuccess: () => void) {
    const diff = getDiff(current)
    clearTimeout(timo)
    timo = setTimeout(async () => {
      await procedure(diff)
      lastSave = clone(current)
      onSuccess()
    }, 500)
  }
  return {
    update: (current: TObj) => {
      update(current, onSuccess)
    },
    unsubscribe,
  }
}
