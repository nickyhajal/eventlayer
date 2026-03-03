import { redirect } from '@sveltejs/kit'

import { FormFns } from '@matterloop/api'

export const load = async (req) => {
  const { locals, url, params } = req

  if (!locals.me?.onboardFormId) {
    redirect(302, '/')
  }
  const formId = locals?.me?.onboardFormId
  if (formId) {
    const formFns = FormFns({ formId })
    const [form, session, userInfo] = await Promise.all([
      formFns.get(),
      formFns.getSessionForUser(locals.me.id, locals.event.id),
      formFns.getUserInfo(locals.me.id, locals.event.id),
    ])
    return { form, session, userInfo }
  } else {
    redirect(302, '/')
  }
}
