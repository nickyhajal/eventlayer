import { Media } from './schema/media'

export * from './schema/user'

export interface SimpleAttendee {
  photo: Media
  firstName: string
  lastName: string
}
export interface AttendeeStore {
  attendees: SimpleAttendee[]
  lastUpdate: string
  hash: string
  num: number
}
