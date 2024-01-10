import { initTRPC } from '@trpc/server'
import {
  procedureWithContext,
  type TrpcContext,
  verifyCommunity,
  verifyMe,
} from './procedureWithContext'
import type { chat, chat_message, chat_user, media } from '@prisma/client'
import {
  actionCreateInput,
  actionQueryInput,
  actionUpdateInput,
} from '@arena/types'
import { z } from 'zod'
import { postToFeed, prisma } from '@arena/db'
import { dayjs } from '@arena/util'

const t = initTRPC.context<TrpcContext>().create()

export interface ChatUser extends chat_user {
  firstName: string
  lastName: string
  userId: string
  photo?: media | null
}
export interface ChatClient extends Omit<chat, 'lastMessage'> {
  users: ChatUser[]
  lastMessage: chat_message
}

export const actionRouter = t.router({
  create: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(actionCreateInput)
    .mutation(async ({ ctx, input }) => {
      const communityId = ctx.community.id
      const meId = ctx.meId
      const { feedItem: feedItemArgs, ...action } = input
      const created = await prisma.action.create({
        data: { ...action, communityId },
      })
      await created.createCompletionForm({ form: {}, elements: [] })
      if (feedItemArgs) {
        const feedItem = await postToFeed({
          ...feedItemArgs,
          actionId: created.id,
          content: `[action-${created.id}]`,
          pinned: input.expiresOn || dayjs().add(24, 'hour').toDate(),
          communityId,
          userId: meId,
        })
        // const feedItem = await prisma.feed_item.create({
        //   data: {
        //     ...feedItemArgs,
        //     actionId: created.id,
        //     communityId,
        //     pi
        //     userId: meId,
        //   },
        // })
        if (feedItem) {
          await prisma.action.update({
            where: { id: created.id },
            data: { feedItemId: feedItem.id },
          })
        }
      }
      return created
    }),
  update: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(actionUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const update = await prisma.action.update({ where: { id }, data })
      return update
    }),
  get: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(actionQueryInput)
    .query(async ({ ctx, input }) => {
      return {}
    }),
  join: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action = await prisma.action.findUnique({ where: { id: input.id } })
      if (!action) throw new Error('Action not found')
      const communityId = ctx.community.id
      const actionUser = await prisma.action_user.create({
        data: {
          userId: ctx.meId,
          actionId: input.id,
          communityId,
        },
      })
      const activeSubmission = await prisma.action.ensureActiveSubmission({
        action,
        communityId: ctx.community.id,
        userId: ctx.meId,
      })
      return {
        ...actionUser,
        action_submissions: [activeSubmission],
      }
    }),
  submit: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action = await prisma.action.findUnique({ where: { id: input.id } })
      if (!action) throw new Error('Action not found')
      const activeSubmission = await prisma.action.ensureActiveSubmission({
        action,
        communityId: ctx.community.id,
        userId: ctx.meId,
      })
      await prisma.action_submission.update({
        where: { id: activeSubmission.id },
        data: { status: 'complete' },
      })
      const channel = await prisma.channel.findFirst({
        where: { autokey: 'submissions', communityId: ctx.community.id },
      })
      if (channel) {
        const feedItem = await postToFeed({
          userId: ctx.meId,
          communityId: ctx.community.id,
          type: 'submission',
          channelId: channel.id,
          actionId: input.id,
          actionType: action.type,
          parentType: 'action_submission',
          parentId: activeSubmission.id,
          attachMedia: true,
          content: ``,
          preContent: [
            {
              render: 'none',
              ...(activeSubmission.status === 'progress'
                ? { type: 'progress' }
                : {
                    // value: input.value,
                    // difficulty: input.difficulty,
                  }),
            },
          ],
        })
        if (feedItem) {
          await prisma.action_submission.update({
            where: { id: activeSubmission.id },
            data: { feedItemId: feedItem.id },
          })
        }
      }
      const rsp = await prisma.action_submission.update({
        where: { id: activeSubmission.id },
        data: { status: 'complete' },
      })
      return rsp
    }),
})
