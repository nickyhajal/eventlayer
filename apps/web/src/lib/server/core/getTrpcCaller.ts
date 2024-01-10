import { createContext } from '$lib/server/procedures/procedureWithContext'
import { router } from '$lib/trpc/router'
import type { RequestEvent } from '../../../routes/$types'

export async function getTrpcCaller(event: RequestEvent) {
	const context = await createContext(event)
	return router.createCaller(context)
}
