import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
	B2_ACCESS_ID,
	B2_ACCESS_KEY,
	CLOUDIMAGE_KEY,
	NODE_ENV,
	STORAGE_DIR,
} from '$env/static/private'
import mime from 'mime-types'

import { and, db, eq, Media, mediaTable } from '@matterloop/db'

interface Args {
	id?: string
	userId: string
	eventId: string
	mimetype: string
	path?: string
	parentType: string
	parentId: string
}

export const getMediaRow = async ({
	id,
	userId,
	eventId,
	mimetype,
	path: inputPath,
	parentType,
	parentId,
}: Args) => {
	let row: Media | undefined | null
	let ext = mime.extension(mimetype) || 'jpg'
	let singles = ['event', 'user', 'venue']
	let dir = NODE_ENV === 'production' ? 'prod' : 'dev'
	let path = inputPath || (parentType === 'user' ? 'avatars' : parentType)
	ext = ext.replace('jpeg', 'jpg')
	if (parentType && parentId && singles.includes(parentType)) {
		const existing = await db.query.mediaTable.findFirst({
			where: and(eq(mediaTable.parentId, parentId), eq(mediaTable.parentType, parentType)),
		})
		if (existing) {
			id = existing.id
		}
	}
	if (id) {
		row = await db.query.mediaTable.findFirst({ where: eq(mediaTable.id, id) })
		if (row) {
			row.version = row.version ? row.version + 1 : 1
			await db
				.update(mediaTable)
				.set({
					status: 'reuploading',
					version: row.version,
					ext,
				})
				.where(eq(mediaTable.id, id))
			try {
				const invalidateUrl = `${STORAGE_DIR ? `${STORAGE_DIR}/` : ''}${row.path}/${row.id}-${
					row.version
				}.${row.ext}`
				const postUrl = 'https://api.cloudimage.com/invalidate'
				const rsp = await fetch(postUrl, {
					method: 'POST',
					headers: {
						'X-Client-Key': `${CLOUDIMAGE_KEY}`,
					},
					body: invalidateUrl,
				})
			} catch (e) {
				console.log(e)
				console.log('already purged')
			}
		}
	} else {
		const insertedRows = await db
			.insert(mediaTable)
			.values({
				userId: userId,
				ext,
				path,
				dir,
				eventId: eventId,
				parentId,
				parentType,
			})
			.returning()
		if (insertedRows.length) {
			row = insertedRows[0]
		}
	}
	return row
}
