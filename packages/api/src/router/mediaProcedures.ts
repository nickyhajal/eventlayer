// lib/trpc/router.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { CLOUDIMAGE_KEY, NODE_ENV, STORAGE_DIR } from '$env/static/private'
import mime from 'mime-types'
import { z } from 'zod'

import { and, db, eq, lt, Media, mediaSchema, mediaTable, or } from '@matterloop/db'

import { getMediaRow } from '../media/getMediaRow'
import { getSignedUploadUrl } from '../media/getSignedUploadUrl'
import {
  procedureWithContext,
  TrpcContext,
  verifyAdmin,
  verifyEvent,
  verifyHasPermission,
  verifyMe,
} from '../procedureWithContext'

interface MediaResponse {
	media: Media
	url: string
}

export type MediaCursor = {
	id: string
	createdAt: string
}

// const

const t = initTRPC.context<TrpcContext>().create()
export const mediaProcedures = t.router({
	list: procedureWithContext
		.input(
			z.object({
				parentType: z.string().optional(),
				limit: z.number().int().min(1).max(60).default(30),
				cursor: z
					.object({
						id: z.string().uuid(),
						createdAt: z.string(),
					})
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { parentType, limit, cursor } = input
			const rows = await db.query.mediaTable.findMany({
				where: and(
					eq(mediaTable.eventId, ctx.event.id),
					...(parentType ? [eq(mediaTable.parentType, parentType)] : []),
					...(cursor
						? [
							or(
								lt(mediaTable.createdAt, cursor.createdAt),
								and(eq(mediaTable.createdAt, cursor.createdAt), lt(mediaTable.id, cursor.id)),
							),
						]
						: []),
				),
				orderBy: (table, { desc }) => [desc(table.createdAt), desc(table.id)],
				limit: limit + 1,
			})
			const hasMore = rows.length > limit
			const items = hasMore ? rows.slice(0, limit) : rows
			const nextCursor = hasMore
				? {
					id: rows[limit].id,
					createdAt: rows[limit].createdAt ?? new Date().toISOString(),
				}
				: null
			return { items, nextCursor }
		}),
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
        path: z.string().optional(),
        mimetype: z.string(),
        allowMultiple: z.boolean().optional(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: { id, parentType, parentId, mimetype, path: inputPath, allowMultiple },
      }): Promise<MediaResponse | null> => {
        // if (!ctx.meId || true) {
        // 	return null
        // }
        const row = await getMediaRow({
          id,
          userId: ctx.me.id,
          eventId: ctx.event.id,
          mimetype,
          path: inputPath,
          parentType,
          parentId,
          allowMultiple,
        })
        if (row?.id) {
          const source = `${row.dir}/${row.path}/${row.id}-${row.version}.${row.ext}`
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
  order: procedureWithContext
    .use(verifyMe())
    .use(verifyEvent())
    .use(verifyAdmin())
    .input(
      z.object({
        changes: z.array(
          z.object({
            id: z.string(),
            ord: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await Promise.all(
          input.changes.map(async (change) => {
            const existing = await db.query.mediaTable.findFirst({
              where: and(eq(mediaTable.id, change.id), eq(mediaTable.eventId, ctx.event.id)),
            })

            if (!existing)
              throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Media not found' })
            return db
              .update(mediaTable)
              .set({ ord: change.ord })
              .where(eq(mediaTable.id, change.id))
          }),
        )
        return true
      } catch (e) {
        return false
      }
    }),
})
