// lib/trpc/router.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import { and, db, eq, eventTable, ilike, or, venueSchema, venueTable } from '@matterloop/db'
import { userTable } from '@matterloop/db/types'
import { pick } from '@matterloop/util'

import { redis } from '../core/redis'
import type { TrpcContext } from '../procedureWithContext'
import { procedureWithContext, verifyAdmin, verifyEvent, verifyMe } from '../procedureWithContext'
import { getGeoCodedAddress } from '../util/getGeocodedAddress'

const t = initTRPC.context<TrpcContext>().create()

async function clearVenueRelatedCaches(mainEventId: string, venueId?: string) {
  const cacheKeys = new Set([`event_heavy:${mainEventId}`])

  if (venueId) {
    const relatedEvents = await db
      .select({ id: eventTable.id })
      .from(eventTable)
      .where(eq(eventTable.venueId, venueId))

    for (const event of relatedEvents) {
      cacheKeys.add(`event_heavy:${event.id}`)
    }
  }

  await Promise.all(Array.from(cacheKeys, (cacheKey) => redis.del(cacheKey)))
}

export const venueProcedures = t.router({
  search: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ q: z.string() }))
    .query(async ({ ctx, input }) => {
      const mainEventId = (ctx.event as { id: string }).id
      const venues = await db.query.venueTable.findMany({
        where: and(
          eq(venueTable.eventId, mainEventId),
          or(
            ilike(venueTable.name, `%${input.q}%`),
            ilike(venueTable.description, `%${input.q}%`),
            ilike(venueTable.address, `%${input.q}%`),
          ),
        ),
        with: { photo: true },
        limit: 10,
      })
      return venues
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
  upsert: procedureWithContext
    // .use(verifyMe())
    .use(verifyEvent())
    .input(venueSchema)
    .mutation(async ({ ctx, input }) => {
      const mainEventId = (ctx.event as { id: string }).id
      const address = input.address?.trim()

      if (input.id) {
        let geo = {}
        const existing = await db.query.venueTable.findFirst({
          where: and(eq(venueTable.id, input.id), eq(venueTable.eventId, mainEventId)),
        })
        const hasExistingGeo = [
          existing?.lat,
          existing?.lon,
          existing?.street,
          existing?.city,
          existing?.region,
          existing?.postalCode,
        ].some(Boolean)

        const shouldGeocode = !!address && (address !== existing?.address || !hasExistingGeo)

        if (shouldGeocode) {
          geo = await getGeoCodedAddress(address)
        }

        await db
          .update(venueTable)
          .set({
            ...pick(input, [
              'name',
              'description',
              'type',
              'eventId',
              'address',
              'mediaId',
              'venueId',
              'visibleOnMainList',
            ]),
            ...geo,
          })
          .where(eq(venueTable.id, input.id))
          .returning()
        const [updatedVenue] = await db.select().from(venueTable).where(eq(venueTable.id, input.id))
        await clearVenueRelatedCaches(mainEventId, input.id)
        return updatedVenue
      } else {
        input.eventId = mainEventId
        const geo = address ? await getGeoCodedAddress(address) : {}
        const [newVenue] = await db
          .insert(venueTable)
          .values({
            ...pick(input, [
              'name',
              'description',
              'type',
              'eventId',
              'address',
              'mediaId',
              'venueId',
            ]),
            ...geo,
          })
          .returning()
        await clearVenueRelatedCaches(mainEventId, newVenue?.id)
        return newVenue
      }
    }),
  order: procedureWithContext
    .use(verifyMe())
    .use(verifyEvent())
    .use(verifyAdmin())
    .input(
      z.object({
        changes: z.array(
          z.object({
            id: z.string(),
            ord: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mainEventId = (ctx.event as { id: string }).id
      try {
        await Promise.all(
          input.changes.map(async (change) => {
            const existing = await db.query.venueTable.findFirst({
              where: and(eq(venueTable.id, change.id), eq(venueTable.eventId, mainEventId)),
            })

            if (!existing)
              throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Venue not found' })

            await clearVenueRelatedCaches(mainEventId, change.id)
            return db
              .update(venueTable)
              .set({ ord: change.ord })
              .where(eq(venueTable.id, change.id))
          }),
        )
        return true
      } catch (e) {
        return false
      }
    }),
})
