import { json, redirect } from '@sveltejs/kit'

// import { EventFns, LinkedInAuthorizer } from '@matterloop/api'

export const GET = async (req) => {
	// console.log(liClient)
	// const search = req.url.searchParams
	// console.log(search.get('code'), search.get('state'))
	// const res = new Response()
	// LinkedInAuthorizer.auth.getAccessToken(
	// 	res,
	// 	search.get('code'),
	// 	search.get('state'),
	// 	function (err, results) {
	// 		if (err) return console.error(err)

	// 		/**
	// 		 * Results have something like:
	// 		 * {"expires_in":5184000,"access_token":". . . ."}
	// 		 */

	// 		console.log(results)
	// 	},
	// )
	return new Response('ok')
}
