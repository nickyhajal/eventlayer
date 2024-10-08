import { redirect } from '@sveltejs/kit'

import { EventFns, FormFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req

	if (!locals.me?.onboardFormId) {
		redirect(301, '/')
	}
	const formId = locals?.me?.onboardFormId
	if (formId) {
		const formFns = FormFns({ formId })
		const form = await formFns.get()
		const session = await formFns.getSessionForUser(locals.me.id, locals.event.id)
		return { form, session }
	} else {
		redirect(301, '/')
	}
}
