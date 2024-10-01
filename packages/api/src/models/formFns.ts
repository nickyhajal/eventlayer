import {
	and,
	asc,
	db,
	eq,
	eventTable,
	eventUserTable,
	formElementTable,
	formSessionTable,
	formTable,
} from '@matterloop/db'

interface Args {
	formId: string
}

export const FormFns = ({ formId }: Args) => ({
	get: async () => {
		const event = await db.query.formTable.findFirst({
			where: and(eq(formTable.id, formId)),
			with: { elements: { orderBy: asc(formElementTable.ord) } },
			// with: { events: true, photo: true, parent: true, children: true },
		})
		return event
	},
	getSessionForUser: async (userId: string, eventId: string) => {
		const session = await db.query.formSessionTable.findFirst({
			where: and(
				eq(formSessionTable.userId, userId),
				eq(formSessionTable.formId, formId),
				eq(formSessionTable.eventId, eventId),
			),
			orderBy: asc(formSessionTable.createdAt),
			with: { responses: true },
		})
		return session
	},
})
