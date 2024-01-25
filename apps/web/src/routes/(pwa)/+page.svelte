<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getMeContext } from '$lib/state/getContexts'
import Calendar from 'lucide-svelte/icons/calendar'
import Home from 'lucide-svelte/icons/home'
import Pin from 'lucide-svelte/icons/map-pinned'
import Menu from 'lucide-svelte/icons/menu'
import Rocket from 'lucide-svelte/icons/rocket'
import Users from 'lucide-svelte/icons/users'
import { ChevronRight } from 'radix-icons-svelte'
import { get } from 'svelte/store'

import { dayjs, getMediaUrl } from '@matterloop/util'

export let data
$: upcoming = data.upcoming
const tabs = [
	{
		label: 'Schedule',
		icon: Calendar,
		href: '/schedule',
	},
	{
		label: 'Venues',
		icon: Pin,
		href: '/venues',
	},
	{
		label: 'Panelists',
		icon: Users,
		href: '/speakers',
	},
	{
		label: 'Program',
		icon: Rocket,
		href: '/program',
	},
]
</script>

<Screen title="Save Our Sites">
	<div class="container mx-auto pt-1 md:max-w-7xl">
		<enhanced:img
			src="../../../static/banner.jpg"
			alt="An alt text"
			class="mx-auto my-10 w-10/12 pb-2 md:w-8/12"
		/>
		<div class="rounded-t-xl bg-slate-200 p-3 text-center font-medium">
			<div class="text-lg">Friday, February 2, 2024</div>
			<div>8AM-5PM</div>
		</div>
		<div class="mb-2 rounded-b-xl bg-slate-100 p-8 text-center font-medium">
			<div>
				<div class="mb-1 px-4 text-lg leading-tight">
					The University of Arizona Student Union Grand Ballroom
				</div>
				1303 E. University Blvd, Tucson, AZ 85719
			</div>
		</div>
		<div class="mt-8">
			<div class="mb-1.5 text-2xl font-semibold text-slate-700">Quick Links</div>
			<div class="grid grid-cols-2 gap-2">
				{#each tabs as { label, icon, href }}
					<Button
						href={href}
						class="flex h-fit flex-col items-center justify-center border-b-2 border-slate-200/60 bg-blue-100/40 pb-2.5 pt-3 text-slate-800 shadow-none hover:bg-blue-50/60"
					>
						<svelte:component this={icon} class="mb-10.5 w-6 text-slate-600" />
						<div class="text-xs">{label}</div>
					</Button>
				{/each}
			</div>
		</div>
		{#if upcoming}
			<div class="mt-8 border-t border-slate-100 pt-8">
				<div class="flex items-center justify-between">
					<div class="mb-1.5 text-2xl font-semibold text-slate-700">Upcoming Events</div>
					<Button
						href="/schedule"
						variant="outline"
						class="flex h-8 items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-red-600"
					>
						View All
						<ChevronRight class="h-4 w-4 text-red-600" />
					</Button>
				</div>
				<div class="w-screen overflow-x-auto pb-2 lg:pb-8">
					<div class="flex w-[49.5rem] gap-4 pb-4 pr-6">
						{#each upcoming as event, i}
							<Button
								variant="outline"
								href={`/schedule/${event.id}`}
								class="h-54 relative mt-2 flex w-[15rem] flex-col items-start justify-start rounded-xl p-1 text-left"
							>
								<img
									alt="{event.name} photo"
									src={getMediaUrl(event.photo)}
									class="h-32 w-full rounded-md bg-cover object-cover"
								/>
								<div class="px-2">
									<div
										class="w-11/12 truncate whitespace-normal pb-1 pt-2 text-base font-semibold leading-tight text-slate-700"
									>
										{event.name}
									</div>
									<div class="whitespace-normal pb-1.5 text-sm font-medium text-slate-600">
										{event.venue.name} | {dayjs(event.startsAt).format('MMM D, h:mma')}
									</div>
								</div>
							</Button>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Screen>
