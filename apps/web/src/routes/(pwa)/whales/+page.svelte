<script lang="ts">
	import { create, insert, remove, search, searchVector } from '@orama/orama'
	import Screen from '$lib/components/Screen.svelte'
	import { getMeContext } from '$lib/state/getContexts'
	import { getContext, onMount } from 'svelte'

	import type { Sponsor } from '@matterloop/db'
	import { getMediaUrl, orderBy, startCase } from '@matterloop/util'

	import type { Snapshot } from '../$types.js'

	export let data
	export const snapshot: Snapshot = {
		capture: () => {
			return {
				scrollY: window.scrollY,
			}
		},
		restore: ({ scrollY }) => {
			window.scrollTo(0, scrollY)
		},
	}
	let query = ''
	let searcher: (q: string) => Promise<typeof data.sponsors>
	onMount(async () => {
		const db = await create({
			schema: {
				title: 'string',
			},
		})
		await Promise.all(
			data.sponsors.map(({ id, title, photo, users, description }) =>
				insert(db, { id, title, photo, users, description }),
			),
		)
		searcher = async (term: string) => {
			const sres = await search(db, { term })
			return sres.hits.map(({ document }) => document)
		}
	})
	const me = getMeContext()
	const seed = getContext<number>('seed')
	function shuffle(array: Array<any>, seed: number) {
		let currentIndex = array.length,
			temporaryValue,
			randomIndex
		seed = seed || 1
		let random = function () {
			var x = Math.sin(seed++) * 10000
			return x - Math.floor(x)
		}
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(random() * currentIndex)
			currentIndex -= 1
			// And swap it with the current element.
			temporaryValue = array[currentIndex]
			array[currentIndex] = array[randomIndex]
			array[randomIndex] = temporaryValue
		}
		return array
	}
	$: sponsors = data.sponsors
	let results: Sponsor[] = []
	$: {
		results = []
		if (query && searcher) {
			searcher(query).then((res) => {
				results = res
			})
		} else {
			results = sponsors
		}
	}
	const sponsorsByType = data.sponsors.reduce((out, sponsor) => {
		if (!out[sponsor.type]) out[sponsor.type] = []
		out[sponsor.type].push(sponsor)
		return out
	}, {})
	const vals = {
		sponsor: 0,
		'impact-partner': 1,
		'organizing-partner': 2,
	}
	const types = Object.keys(sponsorsByType)
	const typeOptions = [
		{ label: 'Whale Tank Finalists', value: 'all' },
		...types
			.map((type) => ({
				label: type === 'staff' ? 'Staff' : `${startCase(type)}s`,
				value: type,
			}))
			.sort((a, b) => vals[a.value] - vals[b.value]),
	]
	let showType = 'all'
</script>

<Screen title="Whale Tank Finalists" bigTitle="Whale Tank Finalists" bodyClass="bg-slate-100">
	<div
		class="topNav sticky z-40 -ml-4 flex w-[calc(100vw+0.25rem)] items-center justify-center border-b border-slate-300/50 bg-slate-50 px-5 text-center text-sm text-slate-600 lg:mx-0 lg:mt-1 lg:w-full lg:rounded-2xl lg:border"
	>
		<input
			type="text"
			class="w-full bg-transparent py-2.5 text-base !outline-none"
			placeholder="Search {typeOptions
				.find(({ value }) => value === showType)
				?.label.toLowerCase()}..."
			bind:value={query}
		/>
	</div>
	<div class="relative mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mb-8 max-w-2xl mt-16 px-4 sm:px-0">
			<p class="text-lg mb-4">
				A pitch contest <b>for</b> innovators, <b>by</b> innovators. We’re not doing “Innovation Theater”
				here. We’re making game-changing connections between startups/tech companies, investors and startups.
				Where innovation meets acceleration, connecting startups directly with customers and investors
				to fast-track clinical breakthroughs.
			</p>
			<p class="text-lg">
				In our “pilot” year we had 24 applications and here are the 6 finalists who will be
				presenting at this year’s Gathering.”
			</p>
		</div>
		<div class="mt-2 grid grid-cols-1 gap-4 py-2 lg:grid-cols-2">
			{#each results.filter(({ type }) => showType === 'all' || type === showType) as sponsor}
				{@const { id, title, url, bookingUrl, photo, description } = sponsor}
				<div class="relative z-0 flex flex-col rounded-2xl bg-white p-1">
					<a href={`/sponsors/${id}`}>
						<div
							class="mb-2 h-36 w-full rounded-xl border border-slate-100 bg-slate-50/60 px-12 py-6"
						>
							<div
								class="h-full w-full bg-contain bg-center bg-no-repeat"
								style="background-image: url({getMediaUrl(photo, 'w-780')})"
							></div>
						</div>
					</a>
					<div class="px-2 pb-2">
						<div class="mb-0.5 truncate text-lg font-semibold">{title}</div>
						<div class="line-clamp mb-0.5 truncate text-sm font-medium text-slate-600">
							{description || '-'}
						</div>
						{#if sponsor.users.length}
							<div class="mt-4 gap-1 rounded-lg bg-blue-50/50 p-2">
								<div class="text-sm font-semibold text-slate-500">Reps Attending</div>
								<div class="mt-1 flex flex-wrap gap-1">
									{#each sponsor.users as { id, user }}
										<a
											href={`/sponsors/${id}`}
											class="flex w-fit items-center rounded-lg border border-b-2 border-slate-100 bg-white px-2 py-1 text-sm font-medium text-slate-700"
										>
											<img
												src={getMediaUrl(user?.photo)}
												class="flex-0 mr-1 h-6 w-6 rounded-full object-cover"
											/>
											{user?.firstName}
											{user?.lastName}
										</a>
									{/each}
								</div>
							</div>
						{/if}
					</div>
					<div
						class="text-a-accent mt-2 flex h-12 w-full items-center justify-around border-t border-slate-100 font-semibold"
					>
						{#if id}
							<a
								href={`/sponsors/${id}`}
								class="flex h-full w-full items-center justify-center border-slate-100 text-center"
								>View Profile</a
							>
						{/if}
						<!-- {#if bookingUrl}
							<a
								href={bookingUrl}
								target="_blank"
								class="flex h-full w-1/2 items-center justify-center text-center">Contact Sponsor</a
							>
						{/if} -->
					</div>
				</div>
			{/each}
		</div>
	</div>
</Screen>

<style lang="postcss">
	.topNav {
		/* top: 3rem; */
		top: calc((env(safe-area-inset-top) * 0.68) + 3rem);
		@media screen and (min-width: 1024px) {
			top: 0.5rem;
		}
	}
</style>
