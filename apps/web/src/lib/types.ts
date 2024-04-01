// export { userTable, signupSchema, createUserSchema, adminAddCompanyUserSchema } from '$lib/schema/user'
// export { companySchema, type CompanySchemaType, type Company,  } from '$lib/schema/company'

import type { Media, User } from '@matterloop/db'

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
