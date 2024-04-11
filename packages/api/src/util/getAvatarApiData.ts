import { AVATAR_API_KEY, AVATAR_API_USER } from '$env/static/private'

import { redis } from '../core/redis'

export async function getAvatarApiData(email: string, provider: string = 'Google') {
	const cacheKey = `avatar-api-data:${email}:${provider}`

	const cached = await redis.get(cacheKey)
	if (cached && !cached.includes(`"Success":false`)) {
		return JSON.parse(cached)
	}

	const url = 'https://avatarapi.com/v2/api.aspx'
	console.log(
		'url',
		JSON.stringify({
			username: AVATAR_API_USER,
			password: AVATAR_API_KEY,
			email,
			...(provider?.length ? { provider } : {}),
		}),
	)
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			username: AVATAR_API_USER,
			password: AVATAR_API_KEY,
			email,
			...(provider?.length ? { provider } : {}),
		}),
	})
	const json = await res.json()

	await redis.set(cacheKey, JSON.stringify(json))

	return json
}
