import { prisma, type ExtendedPrismaClient } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'
import {
  NoCommunityError,
  NotAuthdError,
  NotAuthenticatedError,
} from '$lib/server/helpers/Errors'
import type { chat, chat_message, chat_user, media } from '@prisma/client'

const t = initTRPC.context<TrpcContext>().create()

export interface ChatUser extends chat_user {
  firstName: string
  lastName: string
  userId: string
  photo?: media | null
}
export interface ChatStatus {
  userId: string
  event: 'seen' | 'typing'
  lastSeen?: number
}
export interface ChatClient extends Omit<chat, 'lastMessage'> {
  users: ChatUser[]
  lastMessage: chat_message
}

export const chatRouter = t.router({
  create: procedureWithContext
    .input(
      z.object({
        userIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input: { userIds } }) => {
      if (!userIds) {
        throw new Error('No User IDs set')
      }
      const communityId = ctx.community?.id
      const meId = ctx.meId
      if (!communityId) {
        throw new Error('No Board for Chat')
      }
      if (!meId) {
        throw NotAuthdError()
      }
      const participantHash = prisma.chat.generateHashForUserIds(
        communityId,
        userIds
      )
      const existingByParticipants = await prisma.chat.findUnique({
        where: { participantHash },
      })
      if (existingByParticipants) {
        return existingByParticipants
      }
      const created = await prisma.chat.createFromUserIds(
        [...userIds, meId],
        communityId
      )
      if (!created) {
        throw new Error('Failed to create Chat')
      }
      return created
    }),
  get: procedureWithContext.query(async ({ ctx, input }) => {
    const meId = ctx.meId
    const communityId = ctx.community?.id
    if (!meId) throw new NotAuthenticatedError()
    if (!communityId) throw new NoCommunityError()
    const chatUsers = await prisma.chat_user.findMany({
      where: {
        userId: meId,
        chat: {
          communityId,
        },
      },
      include: {
        chat: true,
      },
    })
    const chatsById: { [key: string]: ChatClient } = {}
    const chatIds = chatUsers.map((row) => {
      chatsById[row.chat.id] = { ...row.chat, users: [] }
      return row.chat.id
    })
    const allChatUsers = await prisma.chat_user.findMany({
      where: { chatId: { in: chatIds } },
      include: { user: { include: { photo: true } } },
    })
    allChatUsers.forEach((user) => {
      if (user.user) {
        const { id, firstName, lastName, photo } = user.user
        chatsById[user.chatId].users.push({
          ...user,
          userId: id,
          firstName,
          lastName,
          photo,
        })
      }
    })
    const chats = Object.values(chatsById)
    return chats
  }),
})
