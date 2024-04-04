import { json, redirect } from '@sveltejs/kit'

import { EventFns, LinkedInAuthorizer } from '@matterloop/api'

export const GET = async (req) => {
	// console.log(liClient)
	const res = await fetch(`https://linkedin.com/in/nickyhajal`)
	const text = await res.text()
	console.log(text)

	return new Response('<pre>' + text + '</pre>')
}
