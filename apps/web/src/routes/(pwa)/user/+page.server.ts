import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
  const { locals, url } = req
  redirect(301, '/')
}
