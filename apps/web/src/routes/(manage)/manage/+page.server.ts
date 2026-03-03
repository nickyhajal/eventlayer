import { error } from '@sveltejs/kit'

import { createContext } from '@matterloop/api/src/procedureWithContext'
import { router } from '@matterloop/api/src/root'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
	if (!event.locals.event?.id) {
		error(404, 'Event not found')
	}

	const caller = router.createCaller(await createContext(event))
	const statsResult = await caller.stats.getStats({
		statKeys: ['attendees', 'assignedTickets', 'unassignedTickets', 'onboardingCompleted'],
	})
	const stats = {
		attendees: 0,
		assignedTickets: 0,
		unassignedTickets: 0,
		onboardingCompleted: 0,
	}

	for (const stat of statsResult) {
		if (stat.key in stats) {
			stats[stat.key as keyof typeof stats] = Number(stat.value ?? 0)
		}
	}

	return { stats }
}
