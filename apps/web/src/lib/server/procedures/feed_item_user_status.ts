// lib/trpc/router.ts
import { prisma, type channel, includeDetails, FeedItemQueryInput } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'
import { NotAuthenticatedError } from '../helpers/Errors'
import { NoCommunityError } from '../helpers/Errors'

const t = initTRPC.context<TrpcContext>().create()
export const feedItemUserStatusRouter = t.router({
  getSavedPosts: procedureWithContext
    .input(FeedItemQueryInput)
    .query(async ({ ctx, input }) => {
      const { community, meId } = ctx
      const { notViewed } = input
      if (!meId) throw new NotAuthenticatedError()
      if (!community) throw new NoCommunityError()
      const statuses = await prisma.feed_item_user_status.findMany({
        where: {
          saved: true,
          userId: meId,
          feed_item: {
            communityId: community.id,
            ...(notViewed ? { views: { none: {} } } : {})
          }
        },
        include: {
          feed_item: {
            include: { user: true, views: true }
          }
        }
      })
      const feedItems = statuses.map(({ feed_item }) => feed_item)
      return includeDetails(feedItems, meId)
    }),
})
