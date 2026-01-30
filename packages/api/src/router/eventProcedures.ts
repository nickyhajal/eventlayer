// lib/trpc/router.ts
import crypto from 'crypto'
import { error } from '@sveltejs/kit'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
  and,
  AttendeeStore,
  count,
  db,
  eq,
  Event,
  eventSchema,
  eventTable,
  eventTicketTable,
  eventUserInfoTable,
  eventUserTable,
  formResponseTable,
  formSessionTable,
  formTable,
  ilike,
  isNull,
  or,
  type EventUser,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { dayjs, pick } from '@matterloop/util'

import { redis } from '../core/redis'
import { EventFns } from '../models/eventFns'
import {
  procedureWithContext,
  verifyEvent,
  verifyMe,
  type TrpcContext,
} from '../procedureWithContext'
import { sendWelcomeEmail } from './userProcedures'

const assignTicketSchema = z.object({
  ticketId: z.string(),
  userId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
})

async function getAttendeeStore(event: Event) {
  if (!event?.id) return false
  let store = await redis.get(`${event.id}_attendeeStore`)
  const attendees = await EventFns({ eventId: event.id }).getUsers()
  const simpleAttendees = attendees.map(({ id, firstName, type, lastName, email, photo }) => ({
    id,
    photo,
    firstName,
    type,
    email,
    lastName,
  }))
  const hash = crypto.createHash('md5').update(JSON.stringify(simpleAttendees)).digest('hex')
  const newStore = {
    attendees: attendees,
    num: attendees.length,
    hash,
    lastUpdate: dayjs().toISOString(),
  }
  redis.set(`${event.id}_attendeeStore`, newStore)
  redis.expire(`${event.id}_attendeeStore`, 5000)
  return newStore
}

const t = initTRPC.context<TrpcContext>().create()
export const eventProcedures = t.router({
  search: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ q: z.string() }))
    .query(async ({ ctx, input }) => {
      const events = await db.query.eventTable.findMany({
        where: and(
          eq(eventTable.eventId, ctx.event.id),
          or(
            ilike(eventTable.name, `%${input.q}%`),
            ilike(eventTable.subtitle, `%${input.q}%`),
          ),
        ),
        limit: 10,
      })
      return events
    }),
  get: procedureWithContext
    .input(
      z
        .object({
          day: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx }) => {
      if (!ctx.meId) {
        return null
      }
      const user = ctx.me
      if (!user || !ctx.me) {
        return null
      }
      return db.query.userTable.findFirst({
        where: eq(userTable.id, ctx.meId),
        with: {},
      })
    }),
  getAttendeeStore: procedureWithContext
    .input(
      z.object({
        hash: z.string(),
        lastUpdate: z.string(),
        num: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const store = await getAttendeeStore(ctx.event)
      if (store && store.hash && store.hash !== input.hash) {
        return store
      }
      return false
    }),
  toggleRsvp: procedureWithContext
    .use(verifyMe())
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let row: Partial<EventUser> | undefined
      const eventId = input.eventId
      const userId = ctx.me.id
      const event = await db.query.eventTable.findFirst({
        where: and(eq(eventTable.id, eventId), eq(eventTable.eventId, ctx.event?.id)),
      })
      let action = ''
      if (!event) {
        throw new Error('Event not found')
      }
      const eventUser = await db.query.eventUserTable.findFirst({
        where: and(eq(eventUserTable.eventId, eventId), eq(eventUserTable.userId, userId)),
      })
      if (eventUser) {
        row = { ...eventUser }
        action = 'remove'
        await db.delete(eventUserTable).where(eq(eventUserTable.id, eventUser.id))
      } else {
        const res = await db
          .insert(eventUserTable)
          .values({ eventId, userId, mainId: event.eventId })
          .returning()
        const countRes = await db
          .select({ count: count() })
          .from(eventUserTable)
          .where(eq(eventUserTable.eventId, eventId))
        if (countRes?.[0]?.count) {
          await db
            .update(eventTable)
            .set({ numAttendees: countRes[0].count })
            .where(eq(eventTable.id, eventId))
        }
        if (res) {
          row = res[0]
          action = 'add'
        }
      }
      redis.del(`event_meals:${ctx.event.id}`)
      redis.del(`event_heavy:${eventId}`)
      redis.del(`event_users:${eventId}`)
      redis.del(`event_usersWithInfo:${eventId}`)
      return {
        row,
        action,
      }
    }),
  addUser: procedureWithContext
    .input(z.object({ userId: z.string(), eventId: z.string(), type: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.query.eventTable.findFirst({
        where: and(eq(eventTable.id, input.eventId), eq(eventTable.eventId, ctx.event?.id)),
      })
      if (!event) return error(404, 'Event not found')
      const existing = await db.query.eventUserTable.findFirst({
        where: and(
          eq(eventUserTable.userId, input.userId),
          eq(eventUserTable.eventId, input.eventId),
        ),
      })
      if (existing) {
        await db
          .update(eventUserTable)
          .set({ type: input.type })
          .where(eq(eventUserTable.id, existing.id))
      } else {
        if (input.eventId !== ctx.event.id) {
          input.mainId = ctx.event.id
        }
        await db
          .insert(eventUserTable)
          .values({ ...input })
          .returning()
      }
      redis.del(`event_heavy:${input.eventId}`)
      redis.del(`event_users:${input.eventId}`)
      redis.del(`event_usersWithInfo:${input.eventId}`)
      redis.del(`event_meals:${input.eventId}`)
      return true
    }),
  removeUser: procedureWithContext
    .input(z.object({ userId: z.string(), eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.query.eventTable.findFirst({
        where: and(eq(eventTable.id, input.eventId), eq(eventTable.eventId, ctx.event?.id)),
      })
      if (!event) return error(404, 'Event not found')
      const existing = await db.query.eventUserTable.findFirst({
        where: and(
          eq(eventUserTable.userId, input.userId),
          eq(eventUserTable.eventId, input.eventId),
        ),
      })
      if (existing) {
        await db.delete(eventUserTable).where(eq(eventUserTable.id, existing.id))
      }
      redis.del(`event_heavy:${input.eventId}`)
      redis.del(`event_users:${input.eventId}`)
      redis.del(`event_usersWithInfo:${input.eventId}`)
      redis.del(`event_meals:${input.eventId}`)
      return true
    }),
  delete: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.query.eventTable.findFirst({
        where: and(eq(eventTable.id, input.id), eq(eventTable.eventId, ctx.event?.id)),
      })
      if (!event) return error(404, 'Event not found')
      // Delete associated event users first
      await db.delete(eventUserTable).where(eq(eventUserTable.eventId, input.id))
      // Delete the event
      await db.delete(eventTable).where(eq(eventTable.id, input.id))
      redis.del(`event_heavy:${input.id}`)
      redis.del(`event_heavy:${ctx.event.id}`)
      redis.del(`event_users:${input.id}`)
      redis.del(`event_usersWithInfo:${input.id}`)
      return true
    }),
  upsert: procedureWithContext
    // .use(verifyMe())
    .use(verifyEvent())
    .input(eventSchema.partial())
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await db
          .update(eventTable)
          .set(
            pick(input, [
              'name',
              'subtitle',
              'description',
              'type',
              'eventId',
              'startsAt',
              'eventFor',
              'colors',
              'ord',
              'mediaId',
              'faviconId',
              'replyEmail',
              'maxAttendees',
              'showAttendeeList',
              'internalNotes',
              'settings',
              'emailFromName',
              'largeLogoId',
              'venueId',
            ]),
          )
          .where(eq(eventTable.id, input.id))
          .returning()
        const updated = await db.select().from(eventTable).where(eq(eventTable.id, input.id))
        if (input.type === 'meal' && input.eventId) {
          redis.del(`event_meals:${input.eventId}`)
        }
        redis.del(`event_heavy:${input.id}`)
        redis.del(`event_heavy:${ctx.event.id}`)
        return updated[0]
      } else {
        const createInput = eventSchema.parse(input)
        createInput.eventId = ctx.event.id
        const newForm = await db
          .insert(eventTable)
          .values(
            pick(createInput, [
              'name',
              'subtitle',
              'description',
              'type',
              'eventId',
              'startsAt',
              'venueId',
            ]),
          )
          .returning()
        console.log(`create event_heavy:${newForm.id}`)
        redis.del(`event_heavy:${newForm.id}`)
        redis.del(`event_heavy:${ctx.event.id}`)

        return newForm[0]
      }
    }),
  assignTicket: procedureWithContext
    .use(verifyMe())
    .use(verifyEvent())
    .input(assignTicketSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.meId) {
        throw new Error('User not found')
      }
      const eventId = ctx.event.id as string
      const meId = ctx.meId as string
      if (!eventId) {
        throw new Error('Event not found')
      }
      if (!meId) {
        throw new Error('User not found')
      }
      const ticket = await db.query.eventTicketTable.findFirst({
        where: and(
          eq(eventTicketTable.id, input.ticketId),
          eq(eventTicketTable.eventId, eventId),
          eq(eventTicketTable.userId, meId),
          isNull(eventTicketTable.assignedOn),
        ),
      })
      if (!ticket) {
        throw new Error('Ticket not found')
      }

      const onboardForm = await db.query.formTable.findFirst({
        where: and(eq(formTable.eventId, eventId), eq(formTable.type, 'onboarding')),
      })
      const onboardFormId = onboardForm?.id

      // Assign to existing user
      if (input.userId) {
        const existing = await db.query.eventUserTable.findFirst({
          where: and(eq(eventUserTable.userId, input.userId), eq(eventUserTable.eventId, eventId)),
        })
        if (existing) {
          throw new Error('This user is already attending the event')
        }
        const updatedTicket = await db
          .update(eventTicketTable)
          .set({ assignedTo: input.userId, assignedOn: dayjs().toISOString() })
          .where(eq(eventTicketTable.id, ticket.id))
          .returning()
        const eventUser = await db
          .insert(eventUserTable)
          .values({
            userId: input.userId,
            eventId,
            type: 'attendee',
            onboardFormId,
            onboardStatus: 'not-sent',
          })
          .returning()
        redis.del(`event_heavy:${eventId}`)
        redis.del(`event_users:${eventId}`)
        redis.del(`event_usersWithInfo:${eventId}`)
        return { ticket: updatedTicket[0], eventUser: eventUser[0] }

        // Assign to new user
      } else if (input.email && input.firstName && input.lastName) {
        let user = await db.query.userTable.findFirst({
          where: eq(userTable.email, input.email),
        })
        if (!user) {
          const inserted = await db
            .insert(userTable)
            .values({
              email: input.email,
              firstName: input.firstName,
              lastName: input.lastName,
            })
            .returning()
          if (inserted) {
            user = inserted[0]
          }
        }
        if (!user) {
          return false
        }
        const existing = await db.query.eventUserTable.findFirst({
          where: and(eq(eventUserTable.userId, user.id), eq(eventUserTable.eventId, eventId)),
        })
        if (existing) {
          throw new Error('This user is already attending the event')
        }
        const eventUser = await db
          .insert(eventUserTable)
          .values({
            userId: user.id,
            eventId,
            type: 'attendee',
            onboardFormId,
            onboardStatus: 'not-sent',
          })
          .returning()
        await db.insert(eventUserInfoTable).values([
          {
            userId: user.id,
            eventId,
            public: true,
            key: 'firstName',
            value: user.firstName,
          },
          {
            userId: user.id,
            eventId,
            public: true,
            key: 'lastName',
            value: user.lastName,
          },
        ])
        const updatedTicket = await db
          .update(eventTicketTable)
          .set({ assignedTo: user.id, assignedOn: dayjs().toISOString() })
          .where(eq(eventTicketTable.id, ticket.id))
          .returning()
        const sessionRes = await db
          .insert(formSessionTable)
          .values({
            userId: user?.id,
            eventId,
            formId: formId,
            status: 'submitted',
            submissionDate: dayjs().format('YYYY-MM-DD'),
          })
          .returning()
        const session = sessionRes[0]
        if (session) {
          const elementRows = Object.entries(elementMap)
            .map(([key, rowKey]) => ({
              userId: user?.id,
              formId: formId,
              eventId: eventId,
              type: 'text',
              sessionId: session.id,
              elementId: rowKey,
              value: user[key] || '',
            }))
            .filter(({ value }) => value)
          if (elementRows.length) {
            await db.insert(formResponseTable).values(elementRows)
          }
        }
        await sendWelcomeEmail(user, ctx.event, eventUser[0])
        redis.del(`event_heavy:${eventId}`)
        redis.del(`event_users:${eventId}`)
        redis.del(`event_usersWithInfo:${eventId}`)
        return { ticket: updatedTicket[0], eventUser: eventUser[0] }
      }
    }),
})

const elementMap = {
  firstName: '64021b5d-2b4d-4fb2-bdcd-6bc6aa81f5f8',
  lastName: '2ff7bd05-56da-4ba0-a9c0-71a9ad320f07',
}
const formId = '1c98ccdf-76af-48b7-985b-a5e98dbd8b17'
