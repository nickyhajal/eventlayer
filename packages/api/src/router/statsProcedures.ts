import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	count,
	db,
	eq,
	eventTicketTable,
	eventUserTable,
	formSessionTable,
	isNotNull,
	isNull,
} from '@matterloop/db'

import { redis } from '../core/redis'
import { procedureWithContext, verifyEvent, type TrpcContext } from '../procedureWithContext'

interface StatConfig {
	label: string
	unit: string
	query: (eventId: string) => Promise<number>
	cacheKey: (eventId: string) => string
	cacheTTL?: number // seconds, defaults to 300 (5 minutes)
}

class Stat {
	private config: StatConfig

	constructor(config: StatConfig) {
		this.config = {
			cacheTTL: 300, // 5 minutes default
			...config,
		}
	}

	async getValue(eventId: string): Promise<number> {
		const cacheKey = this.config.cacheKey(eventId)
		
		// Try to get from cache first
		const cached = await redis.get<number>(cacheKey)
		if (cached !== null && cached !== undefined) {
			return cached
		}

		// If not in cache, execute query
		const value = await this.config.query(eventId)
		
		// Cache the result
		await redis.set(cacheKey, value)
		await redis.expire(cacheKey, this.config.cacheTTL!)

		return value
	}

	get label() {
		return this.config.label
	}

	get unit() {
		return this.config.unit
	}
}

// Define stats
const attendeesStats = new Stat({
	label: 'Total Attendees',
	unit: 'people',
	query: async (eventId: string) => {
		const result = await db
			.select({ count: count() })
			.from(eventUserTable)
			.where(eq(eventUserTable.eventId, eventId))
		return result[0]?.count || 0
	},
	cacheKey: (eventId: string) => `stats:attendees:${eventId}`,
})

const assignedTicketsStats = new Stat({
	label: 'Assigned Tickets',
	unit: 'tickets',
	query: async (eventId: string) => {
		const result = await db
			.select({ count: count() })
			.from(eventTicketTable)
			.where(and(
				eq(eventTicketTable.eventId, eventId),
				isNotNull(eventTicketTable.assignedTo)
			))
		return result[0]?.count || 0
	},
	cacheKey: (eventId: string) => `stats:assigned_tickets:${eventId}`,
})

const unassignedTicketsStats = new Stat({
	label: 'Unassigned Tickets',
	unit: 'tickets',
	query: async (eventId: string) => {
		const result = await db
			.select({ count: count() })
			.from(eventTicketTable)
			.where(and(
				eq(eventTicketTable.eventId, eventId),
				isNull(eventTicketTable.assignedTo)
			))
		return result[0]?.count || 0
	},
	cacheKey: (eventId: string) => `stats:unassigned_tickets:${eventId}`,
})

const onboardingCompletedStats = new Stat({
	label: 'Onboarding Forms Completed',
	unit: 'forms',
	query: async (eventId: string) => {
		const result = await db
			.select({ count: count() })
			.from(formSessionTable)
			.where(and(
				eq(formSessionTable.eventId, eventId),
				eq(formSessionTable.status, 'submitted')
			))
		return result[0]?.count || 0
	},
	cacheKey: (eventId: string) => `stats:onboarding_completed:${eventId}`,
})

const availableStats = {
	attendees: attendeesStats,
	assignedTickets: assignedTicketsStats,
	unassignedTickets: unassignedTicketsStats,
	onboardingCompleted: onboardingCompletedStats,
}

const t = initTRPC.context<TrpcContext>().create()

export const statsProcedures = t.router({
	getStats: procedureWithContext
		.use(verifyEvent())
		.input(
			z.object({
				statKeys: z.array(z.enum(['attendees', 'assignedTickets', 'unassignedTickets', 'onboardingCompleted'])).optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			const eventId = ctx.event.id
			const requestedStats = input.statKeys || Object.keys(availableStats) as (keyof typeof availableStats)[]
			
			const stats = await Promise.all(
				requestedStats.map(async (key) => {
					const stat = availableStats[key]
					if (!stat) return null
					
					const value = await stat.getValue(eventId)
					return {
						key,
						label: stat.label,
						unit: stat.unit,
						value,
					}
				})
			)

			return stats.filter(Boolean)
		}),

	invalidateStats: procedureWithContext
		.use(verifyEvent())
		.input(
			z.object({
				statKeys: z.array(z.enum(['attendees', 'assignedTickets', 'unassignedTickets', 'onboardingCompleted'])).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const eventId = ctx.event.id
			const requestedStats = input.statKeys || Object.keys(availableStats) as (keyof typeof availableStats)[]
			
			await Promise.all(
				requestedStats.map(async (key) => {
					const stat = availableStats[key]
					if (!stat) return
					
					const cacheKey = stat['config'].cacheKey(eventId)
					await redis.del(cacheKey)
				})
			)

			return { success: true }
		}),
})

export { Stat }
export type StatData = {
	key: string
	label: string
	unit: string
	value: number
}