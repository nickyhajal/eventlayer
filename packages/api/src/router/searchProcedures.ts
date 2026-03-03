import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
  and,
  db,
  eq,
  eventTable,
  eventUserTable,
  ilike,
  makeFullEventUser,
  or,
  pageTable,
  sponsorTable,
  venueTable,
} from '@matterloop/db'
import { userTable } from '@matterloop/db/types'

import { procedureWithContext, verifyEvent, type TrpcContext } from '../procedureWithContext'

function scoreMatch(query: string, value: string): number {
  if (!value) return 0
  if (value.toLowerCase().startsWith(query.toLowerCase())) return 2
  if (value.toLowerCase().includes(query.toLowerCase())) return 1
  return 0
}

const t = initTRPC.context<TrpcContext>().create()
export const searchProcedures = t.router({
  global: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const q = input.q.trim()
      const eventId = ctx.event.id

      const [usersRaw, events, venues, pages, sponsors] = await Promise.all([
        // Users: join through event_user to scope by event
        db
          .select()
          .from(userTable)
          .leftJoin(eventUserTable, eq(eventUserTable.userId, userTable.id))
          .where(
            and(
              eq(eventUserTable.eventId, eventId),
              or(
                ilike(userTable.firstName, `%${q}%`),
                ilike(userTable.lastName, `%${q}%`),
                ilike(userTable.email, `%${q}%`),
              ),
            ),
          )
          .limit(8),

        // Events: sub-events of the main event
        db.query.eventTable.findMany({
          where: and(
            eq(eventTable.eventId, eventId),
            or(
              ilike(eventTable.name, `%${q}%`),
              ilike(eventTable.subtitle, `%${q}%`),
            ),
          ),
          limit: 8,
        }),

        // Venues
        db.query.venueTable.findMany({
          where: and(
            eq(venueTable.eventId, eventId),
            or(
              ilike(venueTable.name, `%${q}%`),
              ilike(venueTable.description, `%${q}%`),
              ilike(venueTable.address, `%${q}%`),
            ),
          ),
          with: { photo: true },
          limit: 8,
        }),

        // Pages
        db.query.pageTable.findMany({
          where: and(
            eq(pageTable.eventId, eventId),
            or(
              ilike(pageTable.title, `%${q}%`),
              ilike(pageTable.subtitle, `%${q}%`),
              ilike(pageTable.path, `%${q}%`),
            ),
          ),
          limit: 8,
        }),

        // Sponsors
        db.query.sponsorTable.findMany({
          where: and(
            eq(sponsorTable.eventId, eventId),
            or(
              ilike(sponsorTable.title, `%${q}%`),
              ilike(sponsorTable.description, `%${q}%`),
            ),
          ),
          with: { photo: true },
          limit: 8,
        }),
      ])

      // Sort users by match quality
      const users = usersRaw
        .map((row) => makeFullEventUser({ user: row.auth_user, eventUser: row.event_user }))
        .sort((a, b) => {
          const scoreA =
            scoreMatch(q, a.firstName) + scoreMatch(q, a.lastName) + scoreMatch(q, a.email)
          const scoreB =
            scoreMatch(q, b.firstName) + scoreMatch(q, b.lastName) + scoreMatch(q, b.email)
          return scoreB - scoreA
        })

      return {
        users,
        events,
        venues,
        pages,
        sponsors,
      }
    }),
})
