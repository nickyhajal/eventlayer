import { redirect } from '@sveltejs/kit'

import { EventFns, FormFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req

	console.log(1, locals.me)
	if (!locals.me?.onboardFormId) {
		console.log(2, 'red')
		redirect(302, '/')
	}
	const formId = locals?.me?.onboardFormId
	console.log(3, 'fo', formId)
	if (formId) {
		console.log(4, 'fo', formId)
		const formFns = FormFns({ formId })
		const form = await formFns.get()
		const session = await formFns.getSessionForUser(locals.me.id)
		return { form, session }
	} else {
		console.log(5, 'red')
		redirect(302, '/')
	}
}
