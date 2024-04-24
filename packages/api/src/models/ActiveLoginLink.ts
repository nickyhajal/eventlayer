import { db, Event, loginLinkTable, lt } from '@matterloop/db'
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
					expires: dayjs().add(7, 'day').toISOString(),
				})
				.returning()
			if (!loginLink[0]) {
				throw new Error('Error generating login link')
			}
			const domain = event?.domainId ? `${event?.domainId}.eventlayer.co` : 'eventlayer.co'
			return {
				url: `https://${domain}/login/${loginLink[0].publicId}${to ? `?to=${to}` : ''}`,
				code: loginLink[0].publicId,
			}
		} catch (e) {
			throw new Error('Error generating login link')
		}
	}
}
