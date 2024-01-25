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
	<div class="container mx-auto pt-10 md:max-w-7xl">
		<enhanced:img
			src="../../../static/banner.jpg"
			alt="An alt text"
			class="mx-auto my-10 w-full md:w-8/12"
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
		<div class="mt-8 border-t border-slate-100 pt-8">
			<div class="text-base font-extrabold uppercase text-slate-500">Next Up</div>
			<div class="mt-1 text-xl font-bold text-slate-700">Kick-off Get Together</div>
		</div>
	</div>
</Screen>
