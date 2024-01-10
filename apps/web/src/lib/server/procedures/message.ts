import { Prisma, prisma } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'
import { NotAuthenticatedError } from '$lib/server/helpers/Errors'
import { push } from '$lib/server/push'
import type { ChatStatus } from './chat'

const t = initTRPC.context<TrpcContext>().create()

export const messageRouter = t.router({
  get: procedureWithContext
    .input(
      z.object({
        chatId: z.string(),
        count: z.number().default(15),
        before: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { chatId, count, before } = input
      const where = {
        chatId,
      }
      if (before) {
        // where.num = LessThan(before)
      }
      const messages = await prisma.chat_message.findMany({
        where,
        take: count,
        orderBy: { num: 'desc' },
      })
      return messages
    }),
  create: procedureWithContext
    .input(
      z.object({
        content: z.string(),
        chatId: z.string(),
        communityId: z.string(),
        tryToCreate: z.boolean().optional(),
        userIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.meId) throw new NotAuthenticatedError()
      const { content, chatId, communityId, tryToCreate, userIds } = input
      // pre process part
      if (tryToCreate) {
        if (!chatId) {
          throw new Error('No Chat ID set')
        }
        if (!userIds) {
          throw new Error('No User IDs set')
        }
        if (!communityId) {
          throw new Error('No Board for Chat')
        }
        const participantHash = prisma.chat.generateHashForUserIds(
          communityId,
          userIds
        )
        const existingById = await prisma.chat.findFirst({
          where: { id: chatId },
        })
        const existingByParticipants = await prisma.chat.findMany({
          where: { participantHash },
        })
        if (existingById || existingByParticipants.length > 0) {
          throw new Error('Chat already exists')
        }
        const created = await prisma.chat.createFromUserIds(
          chatId,
          [...userIds, ctx.meId],
          communityId
        )
        if (!created) {
          throw new Error('Failed to create Chat')
        } else {
          delete input.userIds
        }
      }
      const currentCount = await prisma.chat_message.count({
        where: { chatId },
      })

      const message = await prisma.chat_message.create({
        data: {
          chatId,
          communityId,
          content,
          userId: ctx.meId,
          type: 'plaintext',
          num: currentCount + 1,
        },
      })

      // post process part
      const chat = await prisma.chat.findUnique({
        where: { id: message.chatId },
      })
      const user = await prisma.user.findUnique({
        where: { id: message.userId },
      })
      const participants = await prisma.chat_user.findMany({
        where: { chatId: message.chatId },
      })
      if (!chat) {
        throw new Error('Chat not found in message post process')
      }
      if (!user) {
        throw new Error('User not found in message post process')
      }
      const lastMessage = {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        num: message.num,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photoId,
        },
      }
      participants.forEach(async (chatuser) => {
        if (chatuser.userId === message.userId) {
          chatuser.lastSeen = message.num
          await prisma.chat_user.update({
            where: { id: chatuser.id },
            data: chatuser,
          })
        }
        push(`CHAT_MESSAGE:${communityId}_${chatuser.userId}`, {
          message: message,
          user,
          chat,
        })
      })

      await prisma.chat.update({
        where: { id: chat.id },
        data: { lastMessage },
      })
      // await prisma.chat.update({ where: { id: chat.id }, data: chat as Prisma.chatUncheckedUpdateInput })
      // await Promise.all(
      //   participants.map(
      //     ({userId}) => (
      //       console.log(`CHATMESSAGE_${message.communityId}_${userId}`),
      //       pubSub?.publish(`CHATMESSAGE_${message.communityId}_${userId}`, {
      //         message: message,
      //         user,
      //         chat,
      //       })
      //     )
      //   )
      // )
    }),
  chatUpdateStatus: procedureWithContext
    .input(
      z.object({
        chatId: z.string(),
        lastSeen: z.number().optional(),
        event: z.enum(['seen', 'typing']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.meId) throw new NotAuthenticatedError()
      const userId = ctx.meId
      const { chatId, lastSeen, event } = input
      const chatStatus: ChatStatus = {
        userId,
        event,
      }
      if (lastSeen) {
        const user = await prisma.chat_user.findFirst({
          where: { chatId, userId },
        })
        if (user) {
          await prisma.chat_user.update({
            where: { id: user.id },
            data: {
              lastSeen,
              lastSeenAt: new Date(),
            },
          })
          chatStatus.lastSeen = lastSeen
        }
      }
      console.log('pushing to', `CHAT_STATUS:${chatId}`)
      push(`CHAT_STATUS:${chatId}`, chatStatus)
    }),
})
