import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// import type { Router } from './src/root'
export { EventFns } from './src/models/eventFns'
export { VenueFns } from './src/models/venueFns'
export { FormFns } from './src/models/formFns'
// export { UserFns } from './src/models/userFns'
export { router, Router } from './src/root'

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
// export type RouterInputs = inferRouterInputs<Router>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
// export type RouterOutputs = inferRouterOutputs<Router>
export * from './src/core/auth'
// export * from './src/util/linkedinClient'
