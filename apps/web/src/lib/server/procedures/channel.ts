// lib/trpc/router.ts
import { prisma, type channel } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const communityRouter = t.router({
  get: procedureWithContext.query(async ({ ctx }) => {
    return ctx.community
  }),
  getForCommunity: procedureWithContext
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx }) => {
      return ctx.community
    }),
  create: procedureWithContext
    .input(
      z.object({
        title: z.string(),
        communityId: z.string(),
        type: z.string(),
        icon: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }): Promise<channel | undefined> => {
      try {
        const numChannels = await prisma.channel.count({
          where: { communityId: input.communityId },
        })
        const channel = await prisma.channel.create({
          data: {
            title: input.title,
            description: input.description,
            icon: input.icon,
            ord: numChannels,
            communityId: input.communityId,
          },
        })
        return channel
      } catch (e) {
        if (e instanceof Error) {
          console.error(`Error creating community ${e.message}`)
        }
        new Error('Error creating community')
      }
      return undefined
    }),
})
