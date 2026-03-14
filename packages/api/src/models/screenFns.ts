import {
  and,
  asc,
  db,
  eq,
  ne,
  screenConfigTable,
  screenTable,
  type ScreenConfig,
} from '@matterloop/db'

const GLOBAL_SCREEN_KEY = 'GLOBAL'

type UpsertConfigInput = {
  mode: 'upcoming_events' | 'message'
  notificationEnabled: boolean
  notificationMessage?: string | null
  notificationPosition: 'top' | 'bottom'
  messageBody?: string | null
}

export const ScreenFns = ({ eventId }: { eventId: string }) => {
  const ensureGlobalScreen = async () => {
    let globalScreen = await db.query.screenTable.findFirst({
      where: and(eq(screenTable.eventId, eventId), eq(screenTable.key, GLOBAL_SCREEN_KEY)),
    })
    if (!globalScreen) {
      const inserted = await db
        .insert(screenTable)
        .values({
          eventId,
          key: GLOBAL_SCREEN_KEY,
          name: 'Global Defaults',
          status: 'active',
          isSystem: true,
        })
        .returning()
      globalScreen = inserted[0]
    }
    return globalScreen
  }

  const ensureConfig = async (screenId: string) => {
    let config = await db.query.screenConfigTable.findFirst({
      where: and(eq(screenConfigTable.eventId, eventId), eq(screenConfigTable.screenId, screenId)),
    })
    if (!config) {
      const inserted = await db
        .insert(screenConfigTable)
        .values({
          eventId,
          screenId,
          mode: 'upcoming_events',
          notificationEnabled: false,
          notificationPosition: 'top',
          messageBody: '',
        })
        .returning()
      config = inserted[0]
    }
    return config
  }

  const getGlobal = async () => {
    const screen = await ensureGlobalScreen()
    const config = await ensureConfig(screen.id)
    return { screen, config }
  }

  const upsertConfig = async (screenId: string, input: UpsertConfigInput) => {
    const existing = await db.query.screenConfigTable.findFirst({
      where: and(eq(screenConfigTable.eventId, eventId), eq(screenConfigTable.screenId, screenId)),
    })
    if (existing) {
      const updated = await db
        .update(screenConfigTable)
        .set({
          mode: input.mode,
          notificationEnabled: input.notificationEnabled,
          notificationMessage: input.notificationMessage,
          notificationPosition: input.notificationPosition,
          messageBody: input.messageBody,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(screenConfigTable.id, existing.id))
        .returning()
      return updated[0]
    }
    const created = await db
      .insert(screenConfigTable)
      .values({
        eventId,
        screenId,
        mode: input.mode,
        notificationEnabled: input.notificationEnabled,
        notificationMessage: input.notificationMessage,
        notificationPosition: input.notificationPosition,
        messageBody: input.messageBody,
      })
      .returning()
    return created[0]
  }

  const fns = {
    globalKey: GLOBAL_SCREEN_KEY,
    ensureGlobalScreen,
    getGlobal,
    getScreens: async ({ includeSystem = false }: { includeSystem?: boolean } = {}) => {
      await ensureGlobalScreen()
      return db.query.screenTable.findMany({
        where: and(
          eq(screenTable.eventId, eventId),
          includeSystem ? undefined : ne(screenTable.key, GLOBAL_SCREEN_KEY),
        ),
        orderBy: [asc(screenTable.createdAt)],
      })
    },
    getScreenById: async (screenId: string) => {
      return db.query.screenTable.findFirst({
        where: and(eq(screenTable.id, screenId), eq(screenTable.eventId, eventId)),
      })
    },
    getScreenByKey: async (screenKey: string) => {
      return db.query.screenTable.findFirst({
        where: and(eq(screenTable.key, screenKey), eq(screenTable.eventId, eventId)),
      })
    },
    createScreen: async ({ name }: { name?: string } = {}) => {
      await ensureGlobalScreen()
      const screens = await db.query.screenTable.findMany({
        where: and(eq(screenTable.eventId, eventId), ne(screenTable.key, GLOBAL_SCREEN_KEY)),
      })
      const nums = screens
        .map((s) => Number(s.key))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b)
      const next = (nums.at(-1) ?? 0) + 1
      const key = String(next)
      const inserted = await db
        .insert(screenTable)
        .values({
          eventId,
          key,
          name: name?.trim() || `Screen ${key}`,
          status: 'active',
          isSystem: false,
        })
        .returning()
      return inserted[0]
    },
    updateScreen: async ({
      id,
      name,
      status,
    }: {
      id: string
      name?: string
      status?: string
    }) => {
      const screen = await db.query.screenTable.findFirst({
        where: and(eq(screenTable.id, id), eq(screenTable.eventId, eventId)),
      })
      if (!screen || screen.key === GLOBAL_SCREEN_KEY) return null
      const updated = await db
        .update(screenTable)
        .set({
          ...(typeof name === 'string' ? { name } : {}),
          ...(typeof status === 'string' ? { status } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(screenTable.id, id))
        .returning()
      return updated[0]
    },
    getConfigByScreenId: async (screenId: string) => {
      return db.query.screenConfigTable.findFirst({
        where: and(eq(screenConfigTable.eventId, eventId), eq(screenConfigTable.screenId, screenId)),
      })
    },
    upsertGlobalConfig: async (input: UpsertConfigInput) => {
      const { screen } = await getGlobal()
      return upsertConfig(screen.id, input)
    },
    upsertScreenConfig: async (screenId: string, input: UpsertConfigInput) => {
      const { screen: globalScreen } = await getGlobal()
      if (screenId === globalScreen.id) {
        return upsertConfig(screenId, input)
      }
      const screen = await db.query.screenTable.findFirst({
        where: and(eq(screenTable.id, screenId), eq(screenTable.eventId, eventId)),
      })
      if (!screen || screen.key === GLOBAL_SCREEN_KEY) return null
      return upsertConfig(screenId, input)
    },
    clearScreenConfig: async (screenId: string) => {
      const screen = await db.query.screenTable.findFirst({
        where: and(eq(screenTable.id, screenId), eq(screenTable.eventId, eventId)),
      })
      if (!screen || screen.key === GLOBAL_SCREEN_KEY) return false
      await db
        .delete(screenConfigTable)
        .where(and(eq(screenConfigTable.eventId, eventId), eq(screenConfigTable.screenId, screenId)))
      return true
    },
    getEffectiveConfigByScreen: async (screenId: string) => {
      const screen = await db.query.screenTable.findFirst({
        where: and(eq(screenTable.id, screenId), eq(screenTable.eventId, eventId)),
      })
      if (!screen || screen.status !== 'active') return null

      const { screen: globalScreen, config: globalConfig } = await getGlobal()
      const ownConfig =
        screen.key === GLOBAL_SCREEN_KEY
          ? globalConfig
          : await db.query.screenConfigTable.findFirst({
              where: and(eq(screenConfigTable.eventId, eventId), eq(screenConfigTable.screenId, screen.id)),
            })

      const effective: ScreenConfig = ownConfig || globalConfig
      return { screen, globalScreen, globalConfig, ownConfig, effective }
    },
    getEffectiveConfigByKey: async (screenKey: string) => {
      const screen = await db.query.screenTable.findFirst({
        where: and(eq(screenTable.eventId, eventId), eq(screenTable.key, screenKey)),
      })
      if (!screen) return null
      return fns.getEffectiveConfigByScreen(screen.id)
    },
  }

  return fns
}
