import { writable } from 'svelte/store'

import type { Event } from '@matterloop/db'

export function eventWritable(_event: Event) {
	let event: Event = _event
	function getContent(key: string) {
		if (event?.contentByKey?.[key]) {
			return event.contentByKey[key]?.body || ''
		}
		return ''
	}
	const { subscribe, set, update } = writable<Event>({ ..._event, getContent })
	return {
		subscribe,
		set: (_event: Event) => {
			event = _event
			set({
				..._event,
				getContent,
			})
		},
	}
}
