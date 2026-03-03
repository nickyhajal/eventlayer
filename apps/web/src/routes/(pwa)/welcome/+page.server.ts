import { redirect } from '@sveltejs/kit'

import { FormFns } from '@matterloop/api'
import { and, db, eq, eventTicketTable, isNull } from '@matterloop/db'

export const load = async (req) => {
  const { locals, url, params } = req
  // console.log('locals', locals.me)
  if (!locals.me?.onboardFormId) {
    if (locals.me?.id) {
      const tickets = await db.query.eventTicketTable.findMany({
        where: and(
          eq(eventTicketTable.userId, locals.me.id),
          eq(eventTicketTable.eventId, locals.event.id),
          isNull(eventTicketTable.assignedTo),
        ),
      })
      if (tickets.length > 0) {
        redirect(302, `/welcome/${tickets[0].assignKey}`)
      } else {
        redirect(302, '/')
      }
    } else {
      redirect(302, '/')
    }
  }
  const formId = locals?.me?.onboardFormId
  if (formId) {
    const formFns = FormFns({ formId })
    const [form, session, userInfo] = await Promise.all([
      formFns.get(),
      formFns.getSessionForUser(locals.me.id, locals.event.id),
      formFns.getUserInfo(locals.me.id, locals.event.id),
    ])
    return { form, session, userInfo }
  } else {
    redirect(301, '/')
  }
}
