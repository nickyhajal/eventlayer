// lib/trpc/router.ts
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import {
  procedureWithContext,
  verifyMe,
  type TrpcContext,
  verifyHasPermission,
} from './procedureWithContext'
import type { media, Prisma, user } from '@prisma/client'
import { getSignedUploadUrl } from '$lib/server/modules/media/getSignedUploadUrl'
import mime from 'mime-types'
import { IMGIX_KEY, NODE_ENV } from '$env/static/private'
import { prisma } from '@arena/db'
import { mediaUpdateInput } from '@arena/types'

interface MediaResponse {
  media: media
  url: string
}
const t = initTRPC.context<TrpcContext>().create()
export const mediaRouter = t.router({
  getMany: procedureWithContext
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input: { id } }) => {
      return prisma.media.findUnique({ where: { id } })
    }),
  update: procedureWithContext
    .use(verifyMe())
    .input(mediaUpdateInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input
      const media = await prisma.media.findUnique({ where: { id } })
      verifyHasPermission({ me: ctx.me, entity: media })
      if (media)
        return prisma.media.update({
          where: { id },
          data,
        })
    }),
  get: procedureWithContext
    .input(
      z.object({
        parentType: z.string().optional(),
        parentId: z.string().optional(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ input: { parentType, parentId, userId } }) => {
      return prisma.media.findMany({
        where: {
          parentType,
          parentId,
          userId,
        },
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
      })
    )
    .mutation(
      async ({
        ctx,
        input: {
          id,
          parentType,
          parentId,
          mimetype,
          feedItemId,
          attachToFeedItemId,
        },
      }): Promise<MediaResponse | null> => {
        if (!ctx.meId) {
          return null
        }
        let row = undefined
        let ext = mime.extension(mimetype) || 'jpg'
        let singles = ['community', 'user']
        let path =
          parentType === 'community'
            ? 'community'
            : parentType === 'user'
            ? 'avatars'
            : 'submissions'
        ext = ext.replace('jpeg', 'jpg')
        if (parentType && parentId && singles.includes(parentType)) {
          const existing = await prisma.media.findFirst({
            where: { parentId, parentType },
          })
          if (existing) {
            id = existing.id
          }
        }
        if (id) {
          row = await prisma.media.findUnique({ where: { id } })
          if (row) {
            row.version = row.version ? row.version + 1 : 1
            await prisma.media.update({
              where: { id },
              data: {
                status: 'reuploading',
                version: row.version,
                ext,
              },
            })
            try {
              const imgixUrl = `https://arena-co.imgix.net/${
                process.env.STORAGE_DIR ? `${process.env.STORAGE_DIR}/` : ''
              }${row.path}/${row.id}-${row.version}.${row.ext}`
              const postUrl = 'https://api.imgix.com/api/v1/purge'
              const url = `https://arena-co.imgix.net/${
                process.env.STORAGE_DIR ? `${process.env.STORAGE_DIR}/` : ''
              }${row.path}/${row.id}-${row.version}.${row.ext}`
              const rsp = await fetch(postUrl, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${IMGIX_KEY}`,
                },
                body: JSON.stringify({
                  data: {
                    type: 'purges',
                    attributes: { url: imgixUrl },
                  },
                }),
              })
            } catch (e) {
              console.log(e)
              console.log('already purged')
            }
          }
        } else {
          row = await prisma.media.create({
            data: {
              status: 'uploading',
              userId: ctx.meId,
              feedItemId,
              attachToFeedItemId,
              ext,
              path,
              parentId,
              parentType,
            },
          })
        }
        if (row?.id) {
          const source = `${
            NODE_ENV === 'production' ? 'prod' : 'dev'
          }/${path}/${row.id}-${row.version}.${ext}`
          const url = await getSignedUploadUrl(source)

          return {
            url: url || '',
            media: row,
          }
        }
        return null
      }
    ),
  delete: procedureWithContext
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // delete from b2
      await prisma.media.delete({ where: { id: input.id } })
      return true
    }),
})
