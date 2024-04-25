import { create, insert, remove, search, searchVector } from '@orama/orama'
import { trpc } from '$lib/trpc/client'
import { get, type Writable } from 'svelte/store'

import type { AttendeeStore } from '@matterloop/db'
import { dayjs } from '@matterloop/util'

export const loadAttendeeStore = async (store: Writable<AttendeeStore>) => {
	const current = get(store)
	const { attendees: existingAttendees, ...remoteValues } = current
	let expired = false
	let res
	if (current.lastUpdate && dayjs().diff(dayjs(current.lastUpdate), 'minute') > 5) {
		expired = true
	}
	if (expired) {
		res = await trpc().event.getAttendeeStore.query(remoteValues)
		if (res) {
			store.set(res)
		}
	}
	const attendees = res?.attendees || existingAttendees
	const db = await create({
		schema: {
			firstName: 'string',
			type: 'string',
			lastName: 'string',
			email: 'string',
		},
	})
	await Promise.all(
		attendees.map(({ id, firstName, type, lastName, email, photo }) =>
			insert(db, { id, firstName, type, lastName, email, photo }),
		),
	)
	const searcher = async (term: string) => {
		const sres = await search(db, { term })
		return sres.hits.map(({ document }) => document)
	}
	searcher.users = store
	return searcher
}
