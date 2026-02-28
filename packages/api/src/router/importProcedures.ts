import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
  and,
  db,
  eq,
  eventUserFieldTable,
  eventUserInfoTable,
  eventUserTable,
  userTable,
} from '@matterloop/db'

import { redis } from '../core/redis'
import {
  procedureWithContext,
  verifyAdmin,
  verifyEvent,
  type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

const importRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  type: z.string().optional(),
  info: z.record(z.string(), z.string()).optional(),
})

function normalizeTypeValue(input?: string): string {
  const normalized = `${input || ''}`
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized || 'attendee'
}

export const importProcedures = t.router({
  getKeySuggestions: procedureWithContext
    .use(verifyAdmin())
    .use(verifyEvent())
    .query(async ({ ctx }) => {
      const [infoRows, fieldRows, attendeeRows] = await Promise.all([
        db.query.eventUserInfoTable.findMany({
          where: eq(eventUserInfoTable.eventId, ctx.event.id),
          columns: { key: true },
        }),
        db.query.eventUserFieldTable.findMany({
          where: eq(eventUserFieldTable.eventId, ctx.event.id),
          columns: { key: true },
        }),
        db
          .select({
            email: userTable.email,
          })
          .from(eventUserTable)
          .innerJoin(userTable, eq(eventUserTable.userId, userTable.id))
          .where(eq(eventUserTable.eventId, ctx.event.id)),
      ])

      const existingKeys = Array.from(
        new Set(
          [...infoRows, ...fieldRows]
            .map((row) => row.key?.trim())
            .filter((key): key is string => Boolean(key)),
        ),
      ).sort((a, b) => a.localeCompare(b))

      const existingEmails = Array.from(
        new Set(
          attendeeRows
            .map((row) => row.email?.trim().toLowerCase())
            .filter((email): email is string => Boolean(email)),
        ),
      )

      return { existingKeys, existingEmails }
    }),
  importUsers: procedureWithContext
    .use(verifyAdmin())
    .use(verifyEvent())
    .input(
      z.object({
        importId: z.string().min(1),
        rows: z.array(importRowSchema).min(1).max(25),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const eventId = ctx.event.id
      const emailSchema = z.string().email()
      const now = new Date().toISOString()

      const totals = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
      }

      const rows: Array<{
        rowNumber: number
        email: string
        status: 'created' | 'updated' | 'skipped'
        reason?: string
      }> = []

      for (const row of input.rows) {
        totals.processed += 1

        const email = row.email.trim().toLowerCase()
        const firstName = row.firstName?.trim() || undefined
        const lastName = row.lastName?.trim() || undefined
        const type = normalizeTypeValue(row.type)

        if (!email || !emailSchema.safeParse(email).success) {
          totals.skipped += 1
          rows.push({
            rowNumber: row.rowNumber,
            email,
            status: 'skipped',
            reason: 'Invalid email',
          })
          continue
        }

        let user = await db.query.userTable.findFirst({
          where: eq(userTable.email, email),
        })

        if (!user) {
          const inserted = await db
            .insert(userTable)
            .values({
              email,
              firstName: firstName || '',
              lastName: lastName || '',
            })
            .returning()
          user = inserted[0]
          if (!user) {
            totals.skipped += 1
            rows.push({
              rowNumber: row.rowNumber,
              email,
              status: 'skipped',
              reason: 'Unable to create user',
            })
            continue
          }
        } else {
          const userUpdates: Record<string, string> = {}
          if (firstName) userUpdates.firstName = firstName
          if (lastName) userUpdates.lastName = lastName
          if (Object.keys(userUpdates).length) {
            await db
              .update(userTable)
              .set({
                ...userUpdates,
                updatedAt: now,
              })
              .where(eq(userTable.id, user.id))
          }
        }

        const existingEventUser = await db.query.eventUserTable.findFirst({
          where: and(eq(eventUserTable.eventId, eventId), eq(eventUserTable.userId, user.id)),
        })

        let status: 'created' | 'updated' = 'updated'
        if (!existingEventUser) {
          await db.insert(eventUserTable).values({
            eventId,
            userId: user.id,
            type,
            status: 'active',
            importId: input.importId,
          })
          status = 'created'
        } else {
          await db
            .update(eventUserTable)
            .set({
              type,
              importId: input.importId,
              updatedAt: now,
            })
            .where(eq(eventUserTable.id, existingEventUser.id))
        }

        const infoEntries = Object.entries(row.info || {}).reduce(
          (acc, [key, value]) => {
            const cleanKey = key.trim()
            const cleanValue = value?.trim() || ''
            if (cleanKey && cleanValue) {
              acc.push({ key: cleanKey, value: cleanValue })
            }
            return acc
          },
          [] as Array<{ key: string; value: string }>,
        )

        if (infoEntries.length) {
          for (const entry of infoEntries) {
            await db
              .insert(eventUserInfoTable)
              .values({
                userId: user.id,
                eventId,
                key: entry.key,
                value: entry.value,
                public: true,
              })
              .onConflictDoUpdate({
                target: [
                  eventUserInfoTable.userId,
                  eventUserInfoTable.eventId,
                  eventUserInfoTable.key,
                ],
                set: {
                  value: entry.value,
                  updatedAt: now,
                },
              })
          }
        }

        if (status === 'created') {
          totals.created += 1
        } else {
          totals.updated += 1
        }

        rows.push({
          rowNumber: row.rowNumber,
          email,
          status,
        })
      }

      redis.del(`event_heavy:${eventId}`)
      redis.del(`event_users:${eventId}`)
      redis.del(`event_usersWithInfo:${eventId}`)

      return {
        importId: input.importId,
        totals,
        rows,
      }
    }),
})
