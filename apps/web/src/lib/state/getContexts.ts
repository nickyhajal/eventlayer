import type { eventWritable } from '$lib/client/models/eventWritable'
import { loadAttendeeStore } from '$lib/util/loadAttendeeSearch'
import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

import type { Event, User, Venue } from '@matterloop/db'

export function getMeContext() {
  return getContext<Writable<User>>('me')
}
// export function getFormContext() {
// 	return getContext<Writable<FormWithElements>>('form')
// }
export function getEventContext() {
  return getContext<ReturnType<typeof eventWritable>>('event')
}
export function getVenuesContext() {
  return getContext<Writable<Venue[]>>('venues')
}

export function getAttendeeSearcherContext() {
  return getContext<Writable<Awaited<ReturnType<typeof loadAttendeeStore>> | (() => void)>>(
    'attendeeSearcher',
  )
}
