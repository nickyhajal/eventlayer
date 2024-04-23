import { Redis } from '@upstash/redis'
import { REDIS_TOKEN, REDIS_URL } from '$env/static/private'

export const redis = new Redis({
	url: REDIS_URL,
	token: REDIS_TOKEN,
})
