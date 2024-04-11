import { redirect } from '@sveltejs/kit'

import { EventFns, FormFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req

	console.log('in welcome', locals.me)
	if (!locals.me?.onboardFormId) {
		console.log('redir 1')
		redirect(301, '/')
	}
	const formId = locals?.me?.onboardFormId
	console.log('in welcome form', formId)
	if (formId) {
		const formFns = FormFns({ formId })
		const form = await formFns.get()
		console.log('3', form)
		const session = await formFns.getSessionForUser(locals.me.id)
		console.log('4', session)
		return { form, session }
	} else {
		console.log('redir 2')
		redirect(301, '/')
	}
}
