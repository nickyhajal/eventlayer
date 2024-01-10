import type { dayjs } from '@matterloop/util'
import type { Company } from '$lib/schema/company'
import type { FormWithElements } from '$lib/schema/form'
import type { User } from '$lib/schema/user'
import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

export function getMeContext() {
	return getContext<Writable<User>>('me')
}
export function getFormContext() {
	return getContext<Writable<FormWithElements>>('form')
}
export function getCompanyContext() {
	return getContext<Writable<Company>>('company')
}
