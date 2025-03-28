<script lang="ts">
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import { getEventContext } from '$lib/state/getContexts.js'
	import { ArrowRight, Ticket, X } from 'lucide-svelte'
	import BadgeCheck from 'lucide-svelte/icons/badge-check'
	import Calendar from 'lucide-svelte/icons/calendar'
	import Map from 'lucide-svelte/icons/map'
	import Pin from 'lucide-svelte/icons/map-pinned'
	import { ChevronRight } from 'radix-icons-svelte'

	import { tw } from '@matterloop/ui'
	import { dayjs, getMediaUrl } from '@matterloop/util'

	export let data
	$: upcoming = data.upcoming
	$: team = data.info.find((info) => info.key === 'diveTeam')
	$: table = data.info.find((info) => info.key === 'dinnerTable')
	let event = getEventContext()
	let tabs = $event.menus
		.filter((m) => m.location === 'quick')
		.map((m) => {
			return { ...m, props: m.props ?? {} }
		})
	if (data?.me?.type !== 'main-stage') {
		tabs = [...tabs]
	}
	// const tabs = [
	// 	{
	// 		label: 'Schedule',
	// 		icon: Calendar,
	// 		href: '/schedule',
	// 	},
	// 	{
	// 		label: 'Venues',
	// 		icon: Pin,
	// 		href: '/venues',
	// 	},
	// 	{
	// 		label: 'Venue Map',
	// 		icon: Map,
	// 		href: '/map',
	// 	},
	// 	{
	// 		label: 'Sponsors',
	// 		icon: BadgeCheck,
	// 		href: '/sponsors',
	// 	},
	// ]
	function getContent(key: string) {
		if (data?.event?.contentByKey?.[key]) {
			return data.event.contentByKey[key]?.body || ''
		}
		return ''
	}
	let ignorePreorderKey = `ignorePreorder-nd26-${dayjs().format('YYYY')}`
	let ignorePreorder =
		typeof window === 'undefined' ? true : localStorage.getItem(ignorePreorderKey) === 'true'
	function handleIgnorePreorder(e: MouseEvent) {
		e.preventDefault()
		e.stopPropagation()
		ignorePreorder = true
		localStorage.setItem(ignorePreorderKey, 'true')
		return false
	}
</script>

<Screen title={$event.name}>
	<div class="shell mx-auto pt-12 md:max-w-7xl">
		{#if $event.getContent('alert')}
			{#if $event.getContent('alert-link')}
				<a
					href={$event.getContent('alert-link')}
					target={$event.getContent('alert-link').includes('eventlayer') ? '' : '_blank'}
					class="bg-amber-100/30 block hover:bg-amber-100/60 transition-all rounded-xl p-4 text-sm text-center -mt-8 lg:-mt-16 lg:mb-36 mb-16 text-slate-700"
				>
					<div class="text-sm font-semibold">
						{$event.getContent('alert')}
					</div>
				</a>
			{:else}
				<div
					class="bg-amber-100/30 rounded-xl p-4 text-sm text-center -mt-8 lg:-mt-16 lg:mb-36 mb-16 text-slate-700"
				>
					<div class="text-sm font-semibold">
						{$event.getContent('alert')}
					</div>
				</div>
			{/if}
		{/if}
		{#if $event.getContent('preorder') && !ignorePreorder}
			<a
				href={$event.getContent('preorder')}
				target="_blank"
				class="w-full overflow-hidden block hover:saturate-[140%] transition-all max-w-xl mx-auto relative border border-[#dae7e6] bg-[#F9FFFF] rounded-xl pt-4 text-center -mt-8 lg:-mt-20 lg:mb-16 mb-2 text-slate-700"
			>
				<button
					class="absolute bg-white/80 p-1 group hover:text-accent rounded-full border border-slate-200/40 right-2.5 top-3.5"
					on:click={handleIgnorePreorder}
				>
					<X class=" h-5 w-5 text-slate-800 group-hover:text-orange-800/60" />
				</button>
				<div class="text-2xl font-h font-semibold mb-6 mt-10 px-2">
					Join us as we continue the adventure!
				</div>
				<div class="px-2"><img src="/banner.png" class="w-72 mx-auto" alt="" /></div>
				<div
					class="bg-[#E2FFFE] border-t border-[#dae7e6] items-center mt-10 font-semibold text-lg font-h py-4 pl-3 pr-2 flex justify-between"
				>
					<div>Pre-order for ND26</div>
					<ArrowRight class="w-6 h-6 text-slate-800" />
				</div>
			</a>
		{:else}
			<img
				src={getMediaUrl($event.largeLogo)}
				alt="An alt text"
				class="mx-auto mb-12 -mt-8 w-3/12 pb-2 md:w-3/12 md:-mt-24"
			/>
		{/if}
		<div class="rounded-t-xl bg-slate-200/70 p-3 text-center font-medium">
			<div class="text-base">
				{$event.getContent('main-start-date')}
			</div>
			<div>{$event.getContent('main-start-time')}</div>
		</div>
		<div
			class="mb-2 rounded-b-xl bg-slate-100/70 p-8 text-center text-sm font-medium leading-snug md:text-base"
		>
			<div>
				<div class=" px-4 text-sm leading-tight md:text-lg">
					{$event.getContent('main-location-name')}
				</div>
				<div class="mt-2 px-4 text-sm leading-tight md:text-base">
					{$event.getContent('main-location-line-1')}
				</div>
				<div class="px-4 text-sm leading-tight md:text-base">
					{$event.getContent('main-location-line-2')}
				</div>
				<div class="mt-2 px-4 text-xs leading-tight md:text-sm">
					{$event.getContent('main-location-line-3')}
				</div>
				<div class="px-4 text-xs leading-tight md:text-sm">
					{$event.getContent('main-location-line-4')}
				</div>
			</div>
		</div>
		<!-- {#if data?.me?.type !== 'main-stage'}
			<div
				class="mb-8 rounded-xl overflow-hidden text-a-accent/90 bg-amber-100/30 mt-8 text-center text-sm font-medium leading-snug md:text-base"
			>
				<div class="grid grid-cols-1 px-8 py-4 bg-amber-100/40">
					<div class="">
						<div class="uppercase font-semibold text-sm text-amber-800/50">Your Dive Team</div>
						<div
							class="text-lg text-slate-600 px-2 py-1 bg-white/60 mt-2 rounded-md w-fit mx-auto font-semibold"
						>
							{team?.value || 'None'}
						</div>
					</div>
					<!-- <div class="">
						<div class="uppercase font-semibold text-sm text-amber-800/50">Your Dinner Table</div>
						<div
							class="text-lg text-slate-600 px-2 py-1 bg-white/60 mt-2 font-semibold rounded-md w-fit mx-auto"
						>
							{table?.value || 'None'}
						</div>
					</div> -->
		<!-- </div> -->
		<!-- <div class=" px-16 font-semibold flex flex-col items-center gap-5 py-8">
					<div class="mx-auto max-w-sm">
						Make sure to RSVP for one of the Day 1: Lunch options to add it to your schedule.
					</div>
					<div>
						<Button href="/event-type" class="bg-amber-700/90 hover:bg-amber-600 text-white"
							>Pick Your Lunch Restaurant for Day 1</Button
						>
					</div>
				</div> -->
		<!-- </div> -->
		<!-- {/if} -->
		<div class="mt-8">
			<div class="mb-1.5 text-2xl font-semibold text-slate-700">Quick Links</div>
			<div class="grid grid-cols-2 gap-2">
				{#if $event.getContent('preorder')}
					<Button
						href={$event.getContent('preorder')}
						variant="secondary"
						class="bg-a-accent col-span-2 border-a-accent hover:bg-a-accent border-b-main/10 text-a-accent flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b border-opacity-[0.07] bg-opacity-[0.02] py-9 text-left text-sm font-semibold hover:bg-opacity-[0.07]"
					>
						<div class="border-main/20 mb-0.5 rounded-full border bg-white/40 p-1.5 opacity-80">
							<div class="icon"><Ticket /></div>
							<!-- <svelte:component this={icon} class="text-main/70  h-[1rem] w-[1rem] flex-none" /> -->
						</div>
						Join us for ND26: Preorder Now
					</Button>
				{/if}
				{#each tabs as { label, icon, link, className }}
					<Button
						href={link}
						variant="secondary"
						class={tw(
							`bg-a-accent border-a-accent hover:bg-a-accent border-b-main/10 text-a-accent flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b border-opacity-[0.07] bg-opacity-[0.02] py-9 text-left text-sm font-semibold hover:bg-opacity-[0.07] ${className}`,
						)}
					>
						{#if icon}
							<div class="border-main/20 mb-0.5 rounded-full border bg-white/40 p-1.5 opacity-80">
								<div class="icon">{@html icon}</div>
								<!-- <svelte:component this={icon} class="text-main/70  h-[1rem] w-[1rem] flex-none" /> -->
							</div>
						{/if}
						<!-- {#if icon}
							<div class="border-main/20 mb-0.5 rounded-full border bg-white/40 p-1.5 opacity-80">
								<svelte:component
									this={icon}
									class="text-a-accent/70 h-[1rem]  w-[1rem] flex-none brightness-90"
								/>
							</div>
						{/if} -->
						<div class="brightness-90">{label}</div>
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
						class="text-a-accent flex h-8 items-center gap-1.5 px-2.5 py-1 text-sm font-medium"
					>
						View All
						<ChevronRight class="text-a-accent h-4 w-4" />
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
									{#if event.venue}
										<div class="whitespace-normal pb-1.5 text-sm font-medium text-slate-600">
											{event.venue.name} | {dayjs(event.startsAt).format('MMM D, h:mma')}
										</div>
									{/if}
								</div>
							</Button>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Screen>

<style lang="postcss">
	.shell {
		position: relative;
		top: calc(env(safe-area-inset-top) - 0.5rem);
	}
	.icon :global(svg) {
		@apply text-a-accent/70 h-[1rem]  w-[1rem] flex-none brightness-90;
	}
</style>
