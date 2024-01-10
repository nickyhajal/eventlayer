// lib/trpc/router.ts
import { prisma } from '@arena/db'
import type { community } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'
import { NotAuthenticatedError } from '$lib/server/helpers/Errors'

const t = initTRPC.context<TrpcContext>().create()
export const communityRouter = t.router({
  get: procedureWithContext.query(async ({ ctx }) => {
    return ctx.community
  }),
  join: procedureWithContext.mutation(async ({ ctx }) => {
    if (!ctx?.community?.id) throw new Error('Community not found')
    if (!ctx.meId) throw new Error('User not found')
    const communityUser = prisma.community_user.create({
      data: {
        communityId: ctx.community.id,
        userId: ctx.meId,
      },
    })
    return communityUser
  }),
  create: procedureWithContext
    .input(z.object({ title: z.string(), subdomainId: z.string() }))
    .mutation(async ({ input, ctx }): Promise<community | undefined> => {
      if (!ctx.meId) throw new NotAuthenticatedError()
      try {
        const community = await prisma.community.create({
          data: {
            title: input.title,
            subdomainId: input.subdomainId,
          },
        })
        await community.initialize()
        await prisma.community_user.create({
          data: {
            userId: ctx.meId,
            communityId: community.id,
            role: 'owner',
          },
        })
        return community
      } catch (e) {
        if (e instanceof Error) {
          console.error(`Error creating community ${e.message}`)
        }
        new Error('Error creating community')
      }
      return undefined
    }),
  update: procedureWithContext
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        subdomainId: z.string().optional(),
        logoId: z.string().optional(),
        onboardVideoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }): Promise<community | undefined> => {
      try {
        const { id, ...data } = input
        const community = await prisma.community.update({
          where: { id: input.id },
          data,
        })
        return community
      } catch (e) {
        if (e instanceof Error) {
          console.error(`Error updating community ${e.message}`)
        }
        new Error('Error updating community')
      }
      return undefined
    }),
  checkSubdomainAvailability: procedureWithContext
    .input(z.object({ subdomain: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return prisma.community.subdomainIsAvailable(input.subdomain)
      } catch (e) {
        throw new Error('Error checking subdomain availability')
      }
    }),
})
