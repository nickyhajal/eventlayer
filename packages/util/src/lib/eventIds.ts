// Hardcoded helpers for event-specific behavior. Prefer per-event settings over time;
// these exist so event-specific spots are greppable and safe to migrate one at a time.

export const ND_EVENT_ID = 'ba3e8c2a-094b-4694-9a75-9fd75a4e00f7'
export const ING_EVENT_ID = 'cf9b62e1-577c-494f-8612-b65b0e8f0832'

type EventRef = string | { id?: string | null; name?: string | null } | null | undefined

function eventIdOf(event: EventRef) {
  return typeof event === 'string' ? event : event?.id
}

export function isND(event: EventRef) {
  return eventIdOf(event) === ND_EVENT_ID
}

export function isING(event: EventRef) {
  return eventIdOf(event) === ING_EVENT_ID
}

export function eventNickname(event: EventRef) {
  if (isND(event)) return 'ND26'
  if (isING(event)) return 'ING'
  return typeof event === 'string' ? '' : event?.name || ''
}
