import { error } from '@sveltejs/kit'
import { getCorsHeaders } from '$lib/server/rest/auth'

import { db } from '@matterloop/db'
import { getMediaUrl } from '@matterloop/util'

import type { RequestHandler } from './$types'

const reservedColumns = new Set(['firstName', 'lastName', 'location', 'avatar'])

const escapeCsvCell = (value: unknown) => {
	const stringValue = value == null ? '' : String(value)
	return `"${stringValue.replaceAll('"', '""')}"`
}

const slugify = (value: string) => {
	const slug = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)

	return slug.length > 0 ? slug : 'event'
}

const getPreferredValue = (primary: string | null | undefined, fallback: string | undefined) => {
	const trimmedPrimary = primary?.trim()
	return trimmedPrimary && trimmedPrimary.length > 0 ? trimmedPrimary : (fallback ?? '')
}

export const OPTIONS: RequestHandler = () => {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(),
	})
}

export const GET: RequestHandler = async ({ locals }) => {
	const event = locals.event

	if (!event) {
		throw error(404, 'Event not found for this URL')
	}

	const [attendees, infoRows] = await Promise.all([
		db.query.eventUserTable.findMany({
			where: (eventUserTable, { eq }) => eq(eventUserTable.eventId, event.id),
			with: {
				user: {
					with: {
						photo: true,
					},
				},
			},
		}),
		db.query.eventUserInfoTable.findMany({
			where: (eventUserInfoTable, { eq }) => eq(eventUserInfoTable.eventId, event.id),
		}),
	])

	const infoByUserId: Record<string, Record<string, string>> = {}
	const dynamicKeys = new Set<string>()

	for (const row of infoRows) {
		if (!row.userId || row.eventId !== event.id || !row.key) continue

		infoByUserId[row.userId] ??= {}
		infoByUserId[row.userId][row.key] = row.value ?? ''

		if (!reservedColumns.has(row.key)) {
			dynamicKeys.add(row.key)
		}
	}

	const orderedDynamicKeys = Array.from(dynamicKeys).sort((a, b) => a.localeCompare(b))
	const headers = ['firstName', 'lastName', 'location', 'avatar', ...orderedDynamicKeys]
	const sortedAttendees = attendees.sort((a, b) => {
		const aInfo = a.userId ? infoByUserId[a.userId] ?? {} : {}
		const bInfo = b.userId ? infoByUserId[b.userId] ?? {} : {}
		const aLastName = getPreferredValue(a.user?.lastName, aInfo.lastName)
		const bLastName = getPreferredValue(b.user?.lastName, bInfo.lastName)
		const byLastName = aLastName.localeCompare(bLastName)
		if (byLastName !== 0) return byLastName

		const aFirstName = getPreferredValue(a.user?.firstName, aInfo.firstName)
		const bFirstName = getPreferredValue(b.user?.firstName, bInfo.firstName)
		const byFirstName = aFirstName.localeCompare(bFirstName)
		if (byFirstName !== 0) return byFirstName

		return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
	})

	const lines = [
		headers.map(escapeCsvCell).join(','),
		...sortedAttendees.map((attendee) => {
			const info = attendee.userId ? infoByUserId[attendee.userId] ?? {} : {}
			const row = {
				firstName: getPreferredValue(attendee.user?.firstName, info.firstName),
				lastName: getPreferredValue(attendee.user?.lastName, info.lastName),
				location: info.location ?? '',
				avatar: attendee.user?.photo ? getMediaUrl(attendee.user.photo) : '',
			}

			return headers
				.map((header) =>
					escapeCsvCell(header in row ? row[header as keyof typeof row] : info[header] ?? ''),
				)
				.join(',')
		}),
	]

	const filename = `${slugify(event.name)}-attendees.csv`

	return new Response(`\uFEFF${lines.join('\n')}\n`, {
		headers: {
			...getCorsHeaders(),
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `inline; filename="${filename}"`,
		},
	})
}
