import {
  and,
  asc,
  db,
  eq,
  eventUserInfoTable,
  formElementTable,
  formSessionTable,
  formTable,
  userTable,
} from '@matterloop/db'

const USER_TABLE_KEYS = ['firstName', 'lastName'] as const

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
  getUserInfo: async (
    userId: string,
    eventId: string,
  ): Promise<Record<string, string>> => {
    const elements = await db.query.formElementTable.findMany({
      where: eq(formElementTable.formId, formId),
      columns: { id: true, userInfoKey: true },
    })
    const withUserInfoKey = elements.filter((el) => el.userInfoKey?.trim())
    if (!withUserInfoKey.length) return {}

    const [user, infoRows] = await Promise.all([
      db.query.userTable.findFirst({
        where: eq(userTable.id, userId),
        columns: { firstName: true, lastName: true },
      }),
      db.query.eventUserInfoTable.findMany({
        where: and(
          eq(eventUserInfoTable.userId, userId),
          eq(eventUserInfoTable.eventId, eventId),
        ),
      }),
    ])
    const infoByKey = Object.fromEntries(
      infoRows.map((r) => [r.key ?? '', r.value ?? '']).filter(([k]) => k),
    )

    const out: Record<string, string> = {}
    for (const el of withUserInfoKey) {
      const key = el.userInfoKey!
      const fromUser = USER_TABLE_KEYS.includes(key as (typeof USER_TABLE_KEYS)[number])
        ? (user?.[key as 'firstName' | 'lastName'] ?? '').trim()
        : ''
      const fromInfo = (infoByKey[key] ?? '').trim()
      const value = fromUser || fromInfo || ''
      if (value) out[el.id] = value
    }
    return out
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
