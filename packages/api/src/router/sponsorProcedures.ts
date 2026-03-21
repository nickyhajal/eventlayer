// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  and,
  db,
  eq,
  eventSponsorConnectionTable,
  eventSchema,
  eventUserTable,
  ilike,
  or,
  sponsorSchema,
  sponsorTable,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { pick } from '@matterloop/util'

import { mailer } from '../../../../apps/web/src/lib/server/core/mailer'
import {
  procedureWithContext,
  verifyAdmin,
  verifyEvent,
  verifyMe,
  type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

const setHeartSchema = z.object({
  sponsorId: z.string(),
  hearted: z.boolean().default(true),
  source: z.string().default('manual'),
})

const capturePublicLeadSchema = z.object({
  sponsorId: z.string(),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  source: z.string().default('qr'),
})

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

function splitName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (!trimmed.length) {
    return { firstName: '', lastName: '' }
  }

  const [firstName, ...rest] = trimmed.split(' ')
  return {
    firstName,
    lastName: rest.join(' '),
  }
}

async function getSponsorForEvent(eventId: string, sponsorId: string) {
  const sponsor = await db.query.sponsorTable.findFirst({
    where: and(eq(sponsorTable.id, sponsorId), eq(sponsorTable.eventId, eventId)),
  })

  if (!sponsor) {
    throw error(404, 'Sponsor not found')
  }

  return sponsor
}

async function getExistingSponsorConnection(eventId: string, sponsorId: string, userId: string) {
  return db.query.eventSponsorConnectionTable.findFirst({
    where: and(
      eq(eventSponsorConnectionTable.eventId, eventId),
      eq(eventSponsorConnectionTable.sponsorId, sponsorId),
      eq(eventSponsorConnectionTable.userId, userId),
    ),
  })
}

async function sendSponsorInterestEmail({
  event,
  to,
  sponsor,
}: {
  event: NonNullable<TrpcContext['event']>
  to: string
  sponsor: Awaited<ReturnType<typeof getSponsorForEvent>>
}) {
  const sponsorName = sponsor.title?.trim() || 'this sponsor'
  const sponsorWebsite = sponsor.url?.trim()
  const sponsorDescription = sponsor.description?.trim()

  const body = [
    `<p style="margin: 0 0 16px;">Thanks for your interest in ${escapeHtml(sponsorName)}!</p>`,
    sponsorWebsite
      ? `<p style="margin: 0 0 16px;">You can find more information about them here: <a href="${escapeHtml(sponsorWebsite)}">${escapeHtml(sponsorWebsite)}</a></p>`
      : '',
    sponsorDescription
      ? `<p style="margin: 0;">${escapeHtml(sponsorDescription).replaceAll('\n', '<br/>')}</p>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  await mailer.send({
    to,
    event,
    subject: `Thanks for your interest in ${sponsorName}!`,
    more_params: { body },
  })
}

async function upsertSponsorHeart({
  eventId,
  sponsorId,
  userId,
  source,
}: {
  eventId: string
  sponsorId: string
  userId: string
  source: string
}) {
  const now = new Date().toISOString()

  await db
    .insert(eventSponsorConnectionTable)
    .values({
      type: 'heart',
      status: 'active',
      source,
      eventId,
      sponsorId,
      userId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        eventSponsorConnectionTable.eventId,
        eventSponsorConnectionTable.sponsorId,
        eventSponsorConnectionTable.userId,
      ],
      set: {
        type: 'heart',
        status: 'active',
        source,
        updatedAt: now,
      },
    })
}

function canViewSponsorLeads(
  me: (User & { sponsorId?: string | null }) | undefined,
  sponsorId: string,
) {
  return Boolean(me?.isSuperAdmin || me?.sponsorId === sponsorId)
}

export const sponsorProcedures = t.router({
  search: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ q: z.string() }))
    .query(async ({ ctx, input }) => {
      const sponsors = await db.query.sponsorTable.findMany({
        where: and(
          eq(sponsorTable.eventId, ctx.event.id),
          or(
            ilike(sponsorTable.title, `%${input.q}%`),
            ilike(sponsorTable.description, `%${input.q}%`),
          ),
        ),
        with: { photo: true },
        limit: 10,
      })
      return sponsors
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
  setHeart: procedureWithContext
    .use(verifyMe())
    .use(verifyEvent())
    .input(setHeartSchema)
    .mutation(async ({ ctx, input }) => {
      const sponsor = await getSponsorForEvent(ctx.event.id, input.sponsorId)
      const existingConnection = input.hearted
        ? await getExistingSponsorConnection(ctx.event.id, sponsor.id, ctx.me.id)
        : null

      if (input.hearted) {
        await upsertSponsorHeart({
          eventId: ctx.event.id,
          sponsorId: sponsor.id,
          userId: ctx.me.id,
          source: input.source,
        })
      } else {
        await db
          .delete(eventSponsorConnectionTable)
          .where(
            and(
              eq(eventSponsorConnectionTable.eventId, ctx.event.id),
              eq(eventSponsorConnectionTable.sponsorId, sponsor.id),
              eq(eventSponsorConnectionTable.userId, ctx.me.id),
            ),
          )
      }

      if (input.hearted && !existingConnection && ctx.me.email) {
        await sendSponsorInterestEmail({
          event: ctx.event,
          to: ctx.me.email,
          sponsor,
        })
      }

      return {
        success: true,
        hearted: input.hearted,
      }
    }),
  capturePublicLead: procedureWithContext
    .use(verifyEvent())
    .input(capturePublicLeadSchema)
    .mutation(async ({ ctx, input }) => {
      const sponsor = await getSponsorForEvent(ctx.event.id, input.sponsorId)
      const email = input.email.trim().toLowerCase()
      const { firstName, lastName } = splitName(input.name)

      let user = await db.query.userTable.findFirst({
        where: eq(userTable.email, email),
      })

      if (!user) {
        const created = await db
          .insert(userTable)
          .values({
            email,
            firstName,
            lastName,
          })
          .returning()
        user = created[0]
      } else {
        const updates: Partial<typeof userTable.$inferInsert> = {}
        if (!user.firstName && firstName) {
          updates.firstName = firstName
        }
        if (!user.lastName && lastName) {
          updates.lastName = lastName
        }
        if (Object.keys(updates).length) {
          const updated = await db
            .update(userTable)
            .set(updates)
            .where(eq(userTable.id, user.id))
            .returning()
          user = updated[0] || user
        }
      }

      if (!user?.id) {
        throw error(500, 'Unable to save sponsor lead')
      }

      const existingConnection = await getExistingSponsorConnection(ctx.event.id, sponsor.id, user.id)

      await upsertSponsorHeart({
        eventId: ctx.event.id,
        sponsorId: sponsor.id,
        userId: user.id,
        source: input.source,
      })

      if (!existingConnection && user.email) {
        await sendSponsorInterestEmail({
          event: ctx.event,
          to: user.email,
          sponsor,
        })
      }

      return {
        success: true,
        alreadyHearted: Boolean(existingConnection),
      }
    }),
  getSponsorLeads: procedureWithContext
    .use(verifyMe())
    .use(verifyEvent())
    .input(z.object({ sponsorId: z.string() }))
    .query(async ({ ctx, input }) => {
      await getSponsorForEvent(ctx.event.id, input.sponsorId)

      if (!canViewSponsorLeads(ctx.me, input.sponsorId)) {
        throw error(401, 'Not Authorized')
      }

      const leads = await db.query.eventSponsorConnectionTable.findMany({
        where: and(
          eq(eventSponsorConnectionTable.eventId, ctx.event.id),
          eq(eventSponsorConnectionTable.sponsorId, input.sponsorId),
        ),
        with: {
          user: true,
        },
      })

      return leads.sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })
    }),
  addRep: procedureWithContext
    .input(z.object({ sponsorId: z.string(), eventUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existing = await db
          .select()
          .from(eventUserTable)
          .where(eq(eventUserTable.id, input.eventUserId))
        if (!existing) {
          return error(404, 'User not in event')
        }
        await db
          .update(eventUserTable)
          .set({ sponsorId: input.sponsorId })
          .where(eq(eventUserTable.id, input.eventUserId))
      } catch (e) {
        return {}
      }
    }),
  removeRep: procedureWithContext
    .input(z.object({ eventUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log(input)
      try {
        await db
          .update(eventUserTable)
          .set({ sponsorId: null })
          .where(eq(eventUserTable.id, input.eventUserId))
      } catch (e) {
        return {}
      }
    }),
  upsert: procedureWithContext
    // .use(verifyMe())
    .use(verifyEvent())
    .input(sponsorSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      if (input.id) {
        await db
          .update(sponsorTable)
          .set({
            ...pick(input, [
              'title',
              'description',
              'url',
              'bookingUrl',
              'type',
              'eventId',
              'mediaId',
              'settings',
            ]),
          })
          .where(eq(sponsorTable.id, input.id))
          .returning()
        const updated = await db.select().from(sponsorTable).where(eq(sponsorTable.id, input.id))
        return updated[0]
      } else {
        input.eventId = ctx.event.id
        const newForm = await db
          .insert(sponsorTable)
          .values(
            pick(input, [
              'title',
              'description',
              'url',
              'bookingUrl',
              'type',
              'eventId',
              'mediaId',
              'settings',
            ]),
          )
          .returning()
        return newForm[0]
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
      try {
        await Promise.all(
          input.changes.map(async (change) => {
            const existing = await db.query.sponsorTable.findFirst({
              where: and(eq(sponsorTable.id, change.id), eq(sponsorTable.eventId, ctx.event.id)),
            })

            if (!existing)
              throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Sponsor not found' })
            return db
              .update(sponsorTable)
              .set({ ord: change.ord })
              .where(eq(sponsorTable.id, change.id))
          }),
        )
        return true
      } catch (e) {
        return false
      }
    }),
})
