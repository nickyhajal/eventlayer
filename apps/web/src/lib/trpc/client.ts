import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { PUBLIC_API_URL } from '$env/static/public'
import type { Router } from '$lib/trpc/router'
import superjson from 'superjson'
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit'

export function trpc(init?: TRPCClientInit) {
	return createTRPCProxyClient<Router>({
		transformer: superjson,
		links: [
			httpBatchLink({
				url: 'http://localhost:8884',
			}),
		],
	})
}
