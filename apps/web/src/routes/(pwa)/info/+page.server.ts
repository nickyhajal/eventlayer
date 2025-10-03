import { redirect } from '@sveltejs/kit'

export const load = async (req) => {
  const { locals, url } = req
  if (locals.me?.canCreateCompany && url.pathname === '/') {
    return redirect(303, '/manage')
  } else {
    return {
      me: req.locals.me ? req.locals.me : null,
    }
  }
}
