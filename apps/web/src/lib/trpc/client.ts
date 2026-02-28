import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit'

import type { Router } from '@matterloop/api/src/root'

// export function trpc(init?: TRPCClientInit) {
// 	return createTRPCClient<Router>({ init, transformer: superjson })
// }

export function trpc(init?: TRPCClientInit) {
  return createTRPCProxyClient<Router>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    ],
  })
}

export const get = (path: string) => {
  return fetch(`/${path}`, {
    credentials: 'include',
  })
}
export const post = (path: string, body: any) => {
  return fetch(`/${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include',
  })
}
