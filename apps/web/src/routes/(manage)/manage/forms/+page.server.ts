// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { db, eq, formResponseTable } from '@matterloop/db'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const eventFns = EventFns(locals.event.id)
  const [forms, responseRows] = await Promise.all([
    eventFns.getForms(),
    db
      .select({
        formId: formResponseTable.formId,
        userId: formResponseTable.userId,
      })
      .from(formResponseTable)
      .where(eq(formResponseTable.eventId, locals.event.id)),
  ])

  const countsByFormId = new Map<string, Set<string>>()
  for (const row of responseRows) {
    if (!row.formId || !row.userId) continue
    const users = countsByFormId.get(row.formId) ?? new Set<string>()
    users.add(row.userId)
    countsByFormId.set(row.formId, users)
  }

  return {
    forms: forms.map((form) => ({
      ...form,
      responseCount: countsByFormId.get(form.id)?.size ?? 0,
    })),
  }
}
