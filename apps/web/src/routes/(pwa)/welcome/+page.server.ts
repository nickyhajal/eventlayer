import { redirect } from '@sveltejs/kit'

import { EventFns, FormFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req

	console.log('in welcome', locals.me)
	if (!locals.me?.onboardFormId) {
		console.log('redir 1')
		redirect(302, '/')
	}
	const formId = locals?.me?.onboardFormId
	console.log('in welcome form', formId)
	if (formId) {
		const formFns = FormFns({ formId })
		const form = await formFns.get()
		const session = await formFns.getSessionForUser(locals.me.id)
		return { form, session }
	} else {
		console.log('redir 2')
		redirect(302, '/')
	}
}
