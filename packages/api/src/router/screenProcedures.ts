import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { publishScreensHardRefresh, publishScreensInvalidation } from '../core/ably'
import { ScreenFns } from '../models/screenFns'
import { procedureWithContext, verifyEvent, type TrpcContext } from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

const screenConfigInput = z.object({
  mode: z.enum(['upcoming_events', 'message']),
  notificationEnabled: z.boolean().default(false),
  notificationMessage: z.string().nullable().optional(),
  notificationPosition: z.enum(['top', 'bottom']).default('top'),
  messageBody: z.string().nullable().optional(),
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
