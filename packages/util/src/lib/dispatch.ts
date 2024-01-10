import { createEventDispatcher } from 'svelte'

export const dispatch = {
  subscribe(fn) {
    fn(createEventDispatcher())
    return () => {}
  },
}
