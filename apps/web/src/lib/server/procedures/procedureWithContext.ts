import { initTRPC, type inferAsyncReturnType } from '@trpc/server'
import superjson from 'superjson'

import type { RequestEvent } from '@sveltejs/kit'
import { NotAuthdError } from '$lib/server/core/Errors'
// import {
// 	NotAuthenticatedError,
// 	NotAuthorizedError,
// } from '$lib/server/helpers/Errors'

export async function createContext(req: RequestEvent) {
	const context: {
		req: RequestEvent
		meId?: string | false | undefined
		me?: MeContext
	} = {
		req,
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
	me: MeContext | undefined
	key?: keyof T
	entity?: T | undefined | null
}
export function verifyHasPermission<T>({ me, key = 'userId', entity }: VerifyArgs<T>) {
	// if (!entity) throw new NotAuthorizedError()
	if (!(me?.id === entity?.[key] || me?.isSuperAdmin || me?.community?.role === 'owner')) {
		// throw new NotAuthorizedError()
	}
}
export const verifyMe = () =>
	middleware(async ({ ctx, input, next }) => {
		if (!ctx.req.locals.me || !ctx.req.locals.meId) {
			throw NotAuthdError()
			// throw new NotAuthenticatedError()
		}
		return next({
			ctx: {
				me: ctx.req.locals.me,
				meId: ctx.req.locals.meId,
			},
		})
	})
