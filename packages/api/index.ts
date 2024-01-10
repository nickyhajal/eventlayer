import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

import type { Router } from './src/root'

export { router, type Router } from './src/root'

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<Router>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<Router>
export * from './src/core/auth'
