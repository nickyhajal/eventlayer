<script lang="ts">
	import AdminScreen from './AdminScreen.svelte'
	import type { PageData } from './$types'

	type DashboardStats = {
		attendees: number
		assignedTickets: number
		unassignedTickets: number
		onboardingCompleted: number
	}

	const emptyStats: DashboardStats = {
		attendees: 0,
		assignedTickets: 0,
		unassignedTickets: 0,
		onboardingCompleted: 0,
	}

	export let data: PageData
	let stats: DashboardStats = data.stats ?? emptyStats

	const hasNonZeroStat = (value: DashboardStats) => Object.values(value).some((count) => count > 0)

	$: {
		const next = data.stats ?? emptyStats
		if (!(hasNonZeroStat(stats) && !hasNonZeroStat(next))) {
			stats = next
		}
	}

	const getPercent = (value: number, total: number) => {
		if (total <= 0) return 0
		return Math.round((value / total) * 100)
	}

	$: attendees = stats.attendees
	$: assignedTickets = stats.assignedTickets
	$: unassignedTickets = stats.unassignedTickets
	$: onboardingCompleted = stats.onboardingCompleted
	$: totalTickets = assignedTickets + unassignedTickets
	$: ticketsAssignedPercent = getPercent(assignedTickets, totalTickets)
	$: attendeesOnboardedPercent = getPercent(onboardingCompleted, attendees)
</script>

<AdminScreen>
	<div class="">
		<div class="text-2xl font-semibold mb-6">Dashboard</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
				<div class="text-sm font-medium text-gray-500 mb-3">Tickets Assigned</div>
				<div class="text-4xl font-bold text-gray-900 leading-none">{ticketsAssignedPercent}%</div>
				<div class="text-sm text-gray-500 mt-2">
					{assignedTickets.toLocaleString()}/{totalTickets.toLocaleString()}
				</div>
			</div>

			<div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
				<div class="text-sm font-medium text-gray-500 mb-3">Attendees Onboarded</div>
				<div class="text-4xl font-bold text-gray-900 leading-none">{attendeesOnboardedPercent}%</div>
				<div class="text-sm text-gray-500 mt-2">
					{onboardingCompleted.toLocaleString()}/{attendees.toLocaleString()}
				</div>
			</div>

			<div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
				<div class="text-sm font-medium text-gray-500 mb-3">Total Attendees</div>
				<div class="text-4xl font-bold text-gray-900 leading-none">{attendees.toLocaleString()}</div>
				<div class="text-sm text-gray-500 mt-2">Registered attendees</div>
			</div>
		</div>
	</div>
</AdminScreen>
