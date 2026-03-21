import { error } from '@sveltejs/kit'

import type { PageServerLoad } from './$types'
import { dayjs } from '@matterloop/util'

import { EventFns, ScreenFns } from '@matterloop/api'
import { getScreensChannelName } from '@matterloop/api/src/core/ably'

import { getScreenBackdropPreset } from '$lib/screen/screenBackdropPresets'
import {
  compileTailwindForScreenBackdrop,
  prepareScreenBackdropClasses,
} from '$lib/server/compileTailwindForScreenBackdrop'

interface EffectiveScreenData {
  mode: 'upcoming_events' | 'message' | 'image' | 'logo'
  notificationEnabled: boolean
  notificationMessage?: string | null
  notificationPosition: 'top' | 'bottom'
  timeOverrideAt?: string | null
  messageBody?: string | null
  imageUrl?: string | null
  backgroundStyles?: string | null
}

function parseTimeOverrideAt(value: string | null | undefined) {
  if (!value) return null
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const parsed = dayjs(`${year}-${month}-${day}T${hour}:${minute}`)
  return parsed.isValid() ? parsed : null
}

function getWallClockNowInTimeZone(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  const wallClockNow = `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart(
    'hour',
  )}:${getPart('minute')}:${getPart('second')}`

  return dayjs(wallClockNow)
}

function isEffectiveScreenData(value: unknown): value is EffectiveScreenData {
  if (!value || typeof value !== 'object') return false
  if (!('mode' in value) || typeof value.mode !== 'string') return false
  if (!('notificationEnabled' in value) || typeof value.notificationEnabled !== 'boolean') return false
  if (!('notificationPosition' in value) || typeof value.notificationPosition !== 'string') return false
  return true
}

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.event?.id) {
    throw error(404, 'Event not found')
  }

  const eventId = locals.event.id
  const screenFns = ScreenFns({ eventId })
  const resolved = await screenFns.getEffectiveConfigByKey(params.screenId)

  if (!resolved) {
    throw error(404, 'Screen not found')
  }

  const effectiveUnknown: unknown = resolved.effective
  if (!isEffectiveScreenData(effectiveUnknown)) {
    throw error(500, 'Invalid screen config')
  }
  const effective = effectiveUnknown

  const timeOverrideAt = parseTimeOverrideAt(effective.timeOverrideAt)
  const comparisonNow = timeOverrideAt ?? getWallClockNowInTimeZone('America/Chicago')
  const comparisonStart = comparisonNow.subtract(20, 'minute')
  const comparisonEnd = comparisonNow.add(45, 'minute')

  const upcoming =
    effective.mode === 'upcoming_events'
      ? (await EventFns({ eventId }).getEvents()).filter((event) => {
          if (!event.startsAt) return false
          const startsAt = dayjs(event.startsAt)
          return (
            startsAt.isValid() &&
            (startsAt.isSame(comparisonStart) || startsAt.isAfter(comparisonStart)) &&
            (startsAt.isSame(comparisonEnd) || startsAt.isBefore(comparisonEnd))
          )
        })
      : []

  const backgroundStyles = typeof effective.backgroundStyles === 'string' ? effective.backgroundStyles : ''
  const backdropPreset = getScreenBackdropPreset(backgroundStyles)
  let imageModeBackdropCss = ''
  let imageModeBackdropClassNames = ''
  if (!backdropPreset) {
    const rawBackdrop = backgroundStyles.trim()
    // The helper is imported through a workspace alias that loses its function type here.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const prepareBackdropClasses: (value: string) => string | null = prepareScreenBackdropClasses
    const compileBackdropCss: (value: string) => Promise<string> = compileTailwindForScreenBackdrop
    const preparedBackdropClasses = prepareBackdropClasses(rawBackdrop)
    imageModeBackdropClassNames = preparedBackdropClasses ?? ''
    try {
      if (imageModeBackdropClassNames) {
        imageModeBackdropCss = await compileBackdropCss(rawBackdrop)
      }
    } catch (e) {
      console.error('Screen backdrop Tailwind compile failed', e)
    }
  }

  return {
    event: locals.event,
    screen: resolved.screen,
    effective,
    upcoming,
    backdropPresetId: backdropPreset?.id ?? null,
    imageModeBackdropCss,
    imageModeBackdropClassNames,
    timeOverrideAt: timeOverrideAt?.toISOString() ?? null,
    screensChannel: getScreensChannelName(eventId),
  }
}
