import { and, asc, db, eq, eventTable, eventUserTable, formElementTable, formTable } from '@matterloop/db'

interface Args {
	eventId: string
	formId: string
}

export const FormFns = ({ formId, eventId }: Args) => ({
	get: async () => {
		const event = await db.query.formTable.findFirst({
			where: and(eq(formTable.id, formId)),
			with: { elements: { orderBy: asc(formElementTable.ord) } }
			// with: { events: true, photo: true, parent: true, children: true },
		})
		return event
	},
})
