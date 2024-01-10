// lib/trpc/router.ts
import { FeedItemQueryInput, includeDetails, userParticipatingFeedItems } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'
import { NotAuthenticatedError } from '../helpers/Errors'
import { NoCommunityError } from '../helpers/Errors'

const t = initTRPC.context<TrpcContext>().create()
export const feedItemRouter = t.router({
  getUserParticipating: procedureWithContext
    .input(FeedItemQueryInput)
    .query(async ({ ctx, input }) => {
      const { community, meId } = ctx
      if (!meId) throw new NotAuthenticatedError()
      if (!community) throw new NoCommunityError()
      const items = await userParticipatingFeedItems({
        ...input,
        userId: meId,
        communityId: community.id
      })
      return includeDetails(items, meId)
    }),
})
