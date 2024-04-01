import { create, insert, remove, search, searchVector } from '@orama/orama'
import { trpc } from '$lib/trpc/client'
import { get, type Writable } from 'svelte/store'

import type { AttendeeStore } from '@matterloop/db'

export const loadAttendeeStore = async (store: Writable<AttendeeStore>) => {
	const current = get(store)
	const { attendees: existingAttendees, ...remoteValues } = current
	const res = await trpc().event.getAttendeeStore.query(remoteValues)
	const attendees = res.attendees || existingAttendees
	const db = await create({
		schema: {
			firstName: 'string',
			lastName: 'string',
			email: 'string',
		},
	})
	await Promise.all(
		attendees.map(({ id, firstName, lastName, email }) =>
			insert(db, { id, firstName, lastName, email }),
		),
	)
	return async (term: string) => {
		const sres = await search(db, { term })
		return sres.hits.map(({ document }) => document)
	}
}
