import { error, type RequestEvent } from '@sveltejs/kit'
import { initTRPC, type inferAsyncReturnType } from '@trpc/server'
import superjson from 'superjson'

import { User } from '@matterloop/db'

// import { NotAuthdError } from '$lib/server/core/Errors'
// import {
// 	NotAuthenticatedError,
// 	NotAuthorizedError,
// } from '$lib/server/helpers/Errors'

export async function createContext(req: RequestEvent) {
	const context: {
		req: RequestEvent
		cookies: typeof req.cookies
		auth: import('lucia-auth').AuthRequest
		meId?: string | false | undefined
		me?: User
	} = {
		req,
		auth: req.locals.auth,
		cookies: req.locals.cookies,
		me: req.locals.me,
		meId: req.locals.meId,
	}
	return context
}
export type TrpcContext = inferAsyncReturnType<typeof createContext>
export const trpcApp = initTRPC.context<TrpcContext>().create({ transformer: superjson })
const middleware = trpcApp.middleware
export const procedureWithContext = trpcApp.procedure.use(async ({ ctx, next }) => {
	return next({
		ctx,
	})
})

interface VerifyRequestArguments {
	verifyMe: boolean
	verifyCommunity: boolean
	verifyMembership: boolean
}

interface VerifyArgs<T> {
	me: User | undefined
	key?: keyof T
	entity?: T | undefined | null
}
export const verifyMe = () =>
	middleware(async ({ ctx, input, next }) => {
		if (!ctx.req.locals.me || !ctx.req.locals.meId) {
			throw error(401, 'Not Authenticated')
			// throw new NotAuthenticatedError()
		}
		return next({
			ctx: {
				me: ctx.req.locals.me,
				meId: ctx.req.locals.meId,
			},
		})
	})
