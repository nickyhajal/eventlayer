<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import BadgeCheck from 'lucide-svelte/icons/badge-check'
import Calendar from 'lucide-svelte/icons/calendar'
import Map from 'lucide-svelte/icons/map'
import Pin from 'lucide-svelte/icons/map-pinned'
import { ChevronRight } from 'radix-icons-svelte'

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
		label: 'Venue Map',
		icon: Map,
		href: '/map',
	},
	{
		label: 'Sponsors',
		icon: BadgeCheck,
		href: '/sponsors',
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
		<div class="rounded-t-xl bg-slate-200/70 p-3 text-center font-medium">
			<div class="text-base">Friday, February 2, 2024</div>
			<div>8AM-5PM</div>
		</div>
		<div
			class="mb-2 rounded-b-xl bg-slate-100/70 p-8 text-center text-sm font-medium leading-snug md:text-base"
		>
			<div>
				<div class=" px-4 text-sm leading-tight md:text-lg">The University of Arizona</div>
				<div class="mt-2 px-4 text-sm leading-tight md:text-base">
					Student Union Memorial Center
				</div>
				<div class="px-4 text-sm leading-tight md:text-base">3rd Floor - Grand Ballroom</div>
				<div class="mt-2 px-4 text-xs leading-tight md:text-sm">1303 E. University Blvd</div>
				<div class="px-4 text-xs leading-tight md:text-sm">Tucson, AZ 85719</div>
			</div>
		</div>
		<div class="mt-8">
			<div class="mb-1.5 text-2xl font-semibold text-slate-700">Quick Links</div>
			<div class="grid grid-cols-2 gap-2">
				{#each tabs as { label, icon, href }}
					<Button
						href={href}
						variant="secondary"
						class="bg-main border-main hover:bg-main border-b-main/10 text-main flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b border-opacity-[0.07] bg-opacity-[0.02] py-9 text-left text-sm font-semibold hover:bg-opacity-[0.07] "
					>
						{#if icon}
							<div class="border-main/20 mb-0.5 rounded-full border bg-white/40 p-1.5 opacity-80">
								<svelte:component this={icon} class="text-main/70  h-[1rem] w-[1rem] flex-none" />
							</div>
						{/if}
						<div>{label}</div>
					</Button>
					<!-- <Button
						href={href}
						class="flex h-fit flex-col items-center justify-center border-b-2 border-slate-200/60 bg-blue-100/40 pb-2.5 pt-3 text-slate-800 shadow-none hover:bg-blue-50/60"
					>
						<svelte:component this={icon} class="mb-10.5 w-6 text-slate-600" />
						<div class="text-xs">{label}</div>
					</Button> -->
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
				<div class="mb-6 w-[calc(100dvw-0.9rem)] overflow-x-auto lg:w-[calc(100%)] lg:pb-8">
					<div class="flex w-[49.5rem] gap-4 pb-4 pr-6 lg:w-[calc(100%)] lg:pr-0">
						{#each upcoming as event, i}
							<Button
								variant="outline"
								href={`/schedule/${event.id}`}
								class="h-54 relative mt-2 flex w-[15rem] flex-col items-start justify-start rounded-xl p-1 text-left lg:w-[33%]"
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
