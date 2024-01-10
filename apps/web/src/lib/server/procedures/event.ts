import { Prisma, prisma, type media } from '@arena/db'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { procedureWithContext, verifyMe, type TrpcContext, verifyCommunity } from './procedureWithContext'
import { NoCommunityError, NotAuthenticatedError } from '$lib/server/helpers/Errors'
import { type event_user, type event, event_user_role_enum } from '@prisma/client'

const t = initTRPC.context<TrpcContext>().create()

export interface EventUser extends event_user {
  firstName: string
  lastName: string
  fullName: string
  photo?: media | null
}
export interface CalendarEventClient extends Omit<event, 'event_users'> {
  event_users: EventUser[]
}

export const eventRouter = t.router({
  create: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      startAt: z.date(),
      endAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const event = await prisma.event.create({
          data: {
            ...input,
            communityId: ctx.community.id
          }
        })
        const event_user = await prisma.event_user.create({
          data: {
            eventId: event.id,
            userId: ctx.meId,
            role: event_user_role_enum.owner
          }
        })
        return event
      } catch (error) {
        if (error instanceof Error) {
          new Error(error.message)
        } else {
          new Error('Unexpected error')
        }
      }
    }),
  update: procedureWithContext
    .use(verifyMe())
    .use(verifyCommunity())
    .input(z.object({
      id: z.string(),
      communityId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      startAt: z.date(),
      endAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const update = await prisma.event.update({ where: { id }, data })
      return update
    }),
  get: procedureWithContext.query(async ({ ctx, input }) => {
      const communityId = ctx.community?.id
      const tmpEvents = await prisma.event.findMany({
        where: { communityId },
        include: {
          event_users: {
            include: {
              user: {
                include: { photo: true }
              }
            }
          }
        }
      })
      const events: CalendarEventClient[] =  tmpEvents.map((event) => {
        const { event_users, ...tmp_event } = event
        const tmp_event_users = event_users.map((eu) => {
          const { user, ...tmp_eu } = eu
          const { firstName, lastName, fullName, photo } = user
          return {
            ...tmp_eu,
            firstName,
            lastName,
            fullName,
            photo,
          }
        })
        return { ...tmp_event, event_users: tmp_event_users }
      })
      return events
    }),
  toggleEventSignUp: procedureWithContext
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { meId, community } = ctx.req.locals
      if (!meId) throw new NotAuthenticatedError()
      if (!community) throw new NoCommunityError()
      const existing = await prisma.event_user.findUnique({
        where: {
          eventId_userId: {
            eventId: input.eventId,
            userId: meId
          }
        }
      })
      if (existing) {
        return prisma.event_user.delete({ where: { id: existing.id } })
      }
      return prisma.event_user.create({
        data: {
          eventId: input.eventId,
          userId: meId,
        }
      })
    }),
})