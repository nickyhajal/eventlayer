// lib/trpc/router.ts
import { and, db, eq, Media, mediaSchema, mediaTable } from '@matterloop/db'
import { initTRPC } from '@trpc/server'
import { CLOUDIMAGE_KEY, NODE_ENV, STORAGE_DIR } from '$env/static/private'
import mime from 'mime-types'
import { z } from 'zod'

import { getSignedUploadUrl } from '../media/getSignedUploadUrl'
import {
	procedureWithContext,
	TrpcContext,
	verifyHasPermission,
	verifyMe,
} from '../procedureWithContext'

interface MediaResponse {
	media: Media
	url: string
}

// const

const t = initTRPC.context<TrpcContext>().create()
export const mediaProcedures = t.router({
	getMany: procedureWithContext
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input: { id } }) => {
			return db.query.mediaTable.findMany({ where: { id } })
		}),
	update: procedureWithContext
		// .use(verifyMe())
		.input(mediaSchema)
		.mutation(async ({ input, ctx }) => {
			const { id, ...data } = input
			if (id) {
				const media = await db.query.mediaTable.findFirst({ where: eq(mediaTable.id, id) })
				// verifyHasPermission({ me: ctx.me, entity: media })
				if (media) return db.update(mediaTable).set(data).where(eq(mediaTable.id, id)).returning()
			}
		}),
	get: procedureWithContext
		.input(
			z.object({
				parentType: z.string().optional(),
				parentId: z.string().optional(),
				userId: z.string().optional(),
			}),
		)
		.query(async ({ input: { parentType, parentId, userId } }) => {
			return db.query.mediaTable.findMany({
				where: and(
					...(parentType ? [eq(mediaTable.parentType, parentType)] : []),
					...(parentId ? [eq(mediaTable.parentId, parentId)] : []),
					...(userId ? [eq(mediaTable.userId, userId)] : []),
				),
			})
		}),
	getUploadUrl: procedureWithContext
		.input(
			z.object({
				id: z.string().optional(),
				parentType: z.string(),
				parentId: z.string(),
				feedItemId: z.string().optional(),
				attachToFeedItemId: z.string().optional(),
				mimetype: z.string(),
			}),
		)
		.mutation(
			async ({
				ctx,
				input: { id, parentType, parentId, mimetype, feedItemId, attachToFeedItemId },
			}): Promise<MediaResponse | null> => {
				// if (!ctx.meId || true) {
				// 	return null
				// }
				let row: Media | undefined | null
				let ext = mime.extension(mimetype) || 'jpg'
				let singles = ['event', 'user', 'venue']
				let dir = NODE_ENV === 'production' ? 'prod' : 'dev'
				let path = parentType === 'user' ? 'avatars' : parentType
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
							userId: ctx.meId,
							ext,
							path,
							dir,
							eventId: ctx.event.id,
							parentId,
							parentType,
						})
						.returning()
					if (insertedRows.length) {
						row = insertedRows[0]
					}
				}
				if (row?.id) {
					const source = `${dir}/${path}/${row.id}-${row.version}.${ext}`
					const url = await getSignedUploadUrl(source, mimetype)
					return {
						url: url || '',
						media: row,
					}
				}
				return null
			},
		),
	delete: procedureWithContext
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// delete from b2
			await db.delete(mediaTable).where(eq(mediaTable.id, input.id))
			return true
		}),
})
