import type { Event, User } from '@matterloop/db'
import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

export function getMeContext() {
	return getContext<Writable<User>>('me')
}
// export function getFormContext() {
// 	return getContext<Writable<FormWithElements>>('form')
// }
export function getEventContext() {
	return getContext<Writable<Event>>('event')
}
