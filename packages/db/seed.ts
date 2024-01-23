import { Event, eventTable } from './schema/event'

const mainEventIds = ['7d8d0808-d901-4750-bb1a-25dfdfd5d2fb']

interface SeedValueConf {
	type: string
	quantity: number
}
interface SeedConf<T> {}
interface Models {
	events: { [key in keyof Partial<Event>]: SeedValueConf }
}

const models: Models = {
	events: {
		name: { type: 'string', quantity: 1 },
		maxAttendees: { type: 'number', quantity: 1 },
	},
}

// seed main events, get array of event ids

// seed users, can be part of multiple events, some staff, some attendees, some speakers
// connect avatars to users

// seed venues
// seed places

// seed sub events, connect hosts and venues
