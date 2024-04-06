import { json, redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { db, eq, mediaTable } from '@matterloop/db'
import { getMediaUrl, kebabCase } from '@matterloop/util'

export const GET = async (req) => {
	const { locals, url } = req
	if (locals.event?.id) {
		const event = locals.event
		const favicon = event.faviconId
			? await db.query.mediaTable.findFirst({
					where: eq(mediaTable.id, event.faviconId),
				})
			: '/'
		const icon = getMediaUrl(favicon, 'force_format=webp')
		return json({
			short_name: event.name.replace('Conference', 'Conf'),
			name: `${kebabCase(event.name)}-app`,
			start_url: '/',
			icons: [
				{
					src: icon,
					type: 'image/webp',
					sizes: 'any',
				},
			],
			background_color: '#c1cff00',
			display: 'fullscreen',
			scope: '/',
			theme_color: 'rgb(30 41 59)',
			description: `Conference app for ${event.name}`,
		})
	}
	return json({
		short_name: 'Eventlayer',
		name: 'eventlayer-app',
	})
}
