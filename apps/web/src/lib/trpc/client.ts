import type { Router } from '@matterloop/api'
import superjson from 'superjson'
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit'

export function trpc(init?: TRPCClientInit) {
	return createTRPCClient<Router>({ init, transformer: superjson })
}
