import { and, db, desc, Event, gt, inArray, loginLinkTable, lt, ne } from '@matterloop/db'
import { dayjs, getId } from '@matterloop/util'

import { BaseModel } from './BaseModel'

type LoginLink = typeof loginLinkTable

interface GenerateArgs {
  userId: string
  event: Event
  to?: string
  codeLength?: number
}

export class ActiveLoginLink extends BaseModel<LoginLink> {
  table = loginLinkTable

  constructor(data: Partial<LoginLink>) {
    super(data)
  }

  static getUrl({
    loginLink,
    event,
    to,
  }: {
    loginLink: LoginLink['$inferSelect']
    event: Event
    to?: string
  }) {
    let domain = 'eventlayer.co'
    if (event?.domainId) {
      domain = event?.domainId.includes('.') ? event?.domainId : `${event?.domainId}.eventlayer.co`
    }
    return {
      url: `https://${domain}/login/${loginLink.publicId}${to ? `?to=${to}` : ''}`,
      code: loginLink.publicId,
    }
  }

  // Bulk version of the people page's "reuse the newest live link, otherwise create one".
  // Returns userId -> url. Codes are longer than the typed 4-char ones since these are only clicked.
  static async getOrGenerateMany({ userIds, event }: { userIds: string[]; event: Event }) {
    const urls: Record<string, string> = {}
    if (!userIds.length) return urls

    const liveLinks = await db.query.loginLinkTable.findMany({
      where: and(
        inArray(loginLinkTable.userId, userIds),
        ne(loginLinkTable.publicId, ''),
        gt(loginLinkTable.expires, dayjs().toISOString()),
      ),
      orderBy: desc(loginLinkTable.createdAt),
    })
    for (const loginLink of liveLinks) {
      urls[loginLink.userId] ??= ActiveLoginLink.getUrl({ loginLink, event }).url
    }

    const missing = userIds.filter((userId) => !urls[userId])
    if (missing.length) {
      const expires = dayjs().add(30, 'day').toISOString()
      const created = await db
        .insert(loginLinkTable)
        .values(missing.map((userId) => ({ userId, publicId: getId('short', 12), expires })))
        .returning()
      for (const loginLink of created) {
        urls[loginLink.userId] = ActiveLoginLink.getUrl({ loginLink, event }).url
      }
    }

    return urls
  }

  static async generate({ userId, event, to, codeLength }: GenerateArgs) {
    try {
      await db
        .update(loginLinkTable)
        .set({ publicId: '' })
        .where(lt(loginLinkTable.expires, dayjs().toISOString()))
      const loginLink = await db
        .insert(loginLinkTable)
        .values({
          userId: userId,
          publicId: getId('short', codeLength),
          expires: dayjs().add(30, 'day').toISOString(),
        })
        .returning()
      if (!loginLink[0]) {
        throw new Error('Error generating login link')
      }
      let domain = 'eventlayer.co'
      if (event?.domainId) {
        domain = event?.domainId.includes('.')
          ? event?.domainId
          : `${event?.domainId}.eventlayer.co`
      }
      return {
        url: `https://${domain}/login/${loginLink[0].publicId}${to ? `?to=${to}` : ''}`,
        code: loginLink[0].publicId,
      }
    } catch (e) {
      throw new Error('Error generating login link')
    }
  }
}
