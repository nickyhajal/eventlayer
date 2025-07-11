<script lang="ts">
import { invalidate, invalidateAll } from '$app/navigation'
import { onMount } from 'svelte'

import { Button, Input, StatCard } from '@matterloop/ui'
import { trpc } from '$lib/trpc/client'

import AdminScreen from './AdminScreen.svelte'

type StatData = {
	key: string
	label: string
	unit: string
	value: number
}

let stats: StatData[] = []
let loading = true

onMount(async () => {
	try {
		stats = await trpc().stats.getStats.query({})
		loading = false
	} catch (error) {
		console.error('Failed to load stats:', error)
		loading = false
	}
})
</script>

<AdminScreen>
	<div class="">
		<div class="text-2xl font-semibold mb-6">Dashboard</div>
		
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			{#if loading}
				{#each Array(4) as _}
					<StatCard label="Loading..." value={0} unit="" loading={true} />
				{/each}
			{:else}
				{#each stats as stat}
					<StatCard 
						label={stat.label} 
						value={stat.value} 
						unit={stat.unit} 
						loading={false} 
					/>
				{/each}
			{/if}
		</div>
	</div>
</AdminScreen>
