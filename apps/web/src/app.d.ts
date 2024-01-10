import type { Context, Event } from '@matterloop/db'
import type { User } from '$lib/schema/user'
import type { RouteConfig } from '$lib/util/routeConfig'

// for information about these interfaces
declare global {
	namespace App {
		// interface Locals {}
		interface PageData extends Context {
			isPageData?: true
		}
		interface Locals extends Context {
			isLocals?: true
			routeConfig: RouteConfig
			event: Event
			auth: import('lucia-auth').AuthRequest
		}
		// interface Platform {}
	}
}

/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth
		type UserAttributes = {
			email: string
			first_name: string
			last_name: string
		}
	}
}

export {}
