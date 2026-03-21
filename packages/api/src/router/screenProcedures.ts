import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { publishScreensHardRefresh, publishScreensInvalidation } from '../core/ably'
import { ScreenFns } from '../models/screenFns'
import { procedureWithContext, verifyEvent, type TrpcContext } from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

function isAllowedScreenImageUrl(url: string): boolean {
  const t = url.trim()
  if (!t) return true
  if (/^javascript:/i.test(t) || /^data:/i.test(t) || /^vbscript:/i.test(t)) return false
  if (t.startsWith('/')) return !t.includes('//')
  try {
    const u = new URL(t)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isAllowedTimeOverride(value: string | null | undefined): boolean {
  if (value == null || value === '') return true
  return /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/.test(value.trim())
}

const screenConfigInput = z.object({
  mode: z.enum(['upcoming_events', 'message', 'image']),
  notificationEnabled: z.boolean().default(false),
  notificationMessage: z.string().nullable().optional(),
  notificationPosition: z.enum(['top', 'bottom']).default('top'),
  timeOverrideAt: z
    .string()
    .nullable()
    .optional()
    .refine((v) => isAllowedTimeOverride(v), 'Invalid time override'),
  messageBody: z.string().nullable().optional(),
  screenProfileId: z.string().uuid().nullable().optional(),
  imageUrl: z
    .string()
    .max(2048)
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || isAllowedScreenImageUrl(v), 'Invalid image URL'),
  backgroundStyles: z.string().nullable().optional(),
})

const screenProfileInput = z.object({
  name: z.string().trim().min(1).max(120),
  config: screenConfigInput.omit({
    notificationEnabled: true,
    notificationMessage: true,
    notificationPosition: true,
    screenProfileId: true,
  }),
})

async function notify(eventId: string, data?: Record<string, unknown>) {
  try {
    await publishScreensInvalidation(eventId, data)
  } catch (e) {
    console.error('Failed to publish screens update', e)
  }
}

async function publishHardRefresh(eventId: string) {
  try {
    return await publishScreensHardRefresh(eventId)
  } catch (e) {
    console.error('Failed to publish screen hard refresh', e)
    return false
  }
}

export const screenProcedures = t.router({
  list: procedureWithContext.use(verifyEvent()).query(async ({ ctx }) => {
    const screenFns = ScreenFns({ eventId: ctx.event.id })
    const global = await screenFns.getGlobal()
    const screens = await screenFns.getScreens()
    const withConfigs = await Promise.all(
      screens.map(async (screen) => ({
        ...screen,
        config: await screenFns.getConfigByScreenId(screen.id),
      })),
    )
    return {
      global,
      screens: withConfigs,
    }
  }),
  create: procedureWithContext
    .use(verifyEvent())
    .input(
      z
        .object({
          name: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ScreenFns({ eventId: ctx.event.id }).createScreen({ name: input?.name })
      await notify(ctx.event.id, { scope: 'screen', action: 'create', screenId: created.id })
      return created
    }),
  update: procedureWithContext
    .use(verifyEvent())
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ScreenFns({ eventId: ctx.event.id }).updateScreen(input)
      await notify(ctx.event.id, { scope: 'screen', action: 'update', screenId: input.id })
      return updated
    }),
  getGlobalConfig: procedureWithContext.use(verifyEvent()).query(async ({ ctx }) => {
    return ScreenFns({ eventId: ctx.event.id }).getGlobal()
  }),
  upsertGlobalConfig: procedureWithContext
    .use(verifyEvent())
    .input(screenConfigInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await ScreenFns({ eventId: ctx.event.id }).upsertGlobalConfig(input)
      await notify(ctx.event.id, { scope: 'global', action: 'upsert' })
      return updated
    }),
  getScreenConfig: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ screenId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ScreenFns({ eventId: ctx.event.id }).getConfigByScreenId(input.screenId)
    }),
  upsertScreenConfig: procedureWithContext
    .use(verifyEvent())
    .input(
      z.object({
        screenId: z.string().uuid(),
        config: screenConfigInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ScreenFns({ eventId: ctx.event.id }).upsertScreenConfig(
        input.screenId,
        input.config,
      )
      await notify(ctx.event.id, { scope: 'screen_config', action: 'upsert', screenId: input.screenId })
      return updated
    }),
  clearScreenConfig: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ screenId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const cleared = await ScreenFns({ eventId: ctx.event.id }).clearScreenConfig(input.screenId)
      if (cleared) {
        await notify(ctx.event.id, { scope: 'screen_config', action: 'clear', screenId: input.screenId })
      }
      return cleared
    }),
  createProfile: procedureWithContext
    .use(verifyEvent())
    .input(screenProfileInput)
    .mutation(async ({ ctx, input }) => {
      return ScreenFns({ eventId: ctx.event.id }).createProfile(input)
    }),
  updateProfile: procedureWithContext
    .use(verifyEvent())
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        config: screenConfigInput.omit({
          notificationEnabled: true,
          notificationMessage: true,
          notificationPosition: true,
          screenProfileId: true,
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ScreenFns({ eventId: ctx.event.id }).updateProfile(input)
      if (updated) {
        await notify(ctx.event.id, { scope: 'screen_profile', action: 'update', profileId: input.id })
      }
      return updated
    }),
  deleteProfile: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ScreenFns({ eventId: ctx.event.id }).deleteProfile(input.id)
    }),
  getEffectiveById: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ screenId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ScreenFns({ eventId: ctx.event.id }).getEffectiveConfigByScreen(input.screenId)
    }),
  getEffectiveByKey: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ key: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ScreenFns({ eventId: ctx.event.id }).getEffectiveConfigByKey(input.key)
    }),
  /** Broadcast to all `/screen/*` clients: full browser reload (new JS/CSS after deploy). */
  broadcastHardRefresh: procedureWithContext.use(verifyEvent()).mutation(async ({ ctx }) => {
    const ok = await publishHardRefresh(ctx.event.id)
    return { ok }
  }),
})
