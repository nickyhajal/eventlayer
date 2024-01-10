// lib/trpc/router.ts
import { prisma, type notification } from '@arena/db'
import type { community } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, type TrpcContext } from './procedureWithContext'
import { NotAuthenticatedError } from '$lib/server/helpers/Errors'
import { notificationCreateInput, notificationUpdateInput } from '@arena/types'

const t = initTRPC.context<TrpcContext>().create()
export const notificationRouter = t.router({
  create: procedureWithContext
    .input(notificationCreateInput)
    .mutation(async ({ input }): Promise<notification | undefined> => {
      try {
        const notification = await prisma.notification.create({
          data: input,
        })
        if (notification) {
          const email = await prisma.email.create({
            data: {
              subject: input.subject,
              body: input.body,
            },
          })
          const communities = await prisma.community.findMany()
          const createMany = await prisma.notification_event.createMany({
            data: communities.map(({ id }) => ({
              event: input.event_key,
              communityId: id,
              emailId: email.id,
              notificationId: notification.id,
            })),
          })
          return notification
        }
      } catch (e) {
        if (e instanceof Error) {
          console.error(`Error creating notification ${e.message}`)
        }
        new Error('Error creating notification')
        return undefined
      }
    }),
  update: procedureWithContext
    .input(notificationUpdateInput)
    .mutation(async ({ input }): Promise<notification | undefined> => {
      try {
        const { id, ...data } = input
        const notification = await prisma.notification.update({
          where: { id },
          data,
        })

        return notification
      } catch (e) {
        if (e instanceof Error) {
          console.error(`Error creating notification ${e.message}`)
        }
        new Error('Error creating notification')
        return undefined
      }
    }),
})
