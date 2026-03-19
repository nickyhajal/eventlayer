<script lang="ts">
	import { onMount } from 'svelte'

	import { trpc } from '$lib/trpc/client'
	import Button from '$lib/components/ui/button/button.svelte'

	export let sponsorId: string
	export let sponsorName: string

	const storageKey = 'eventlayer-sponsor-lead-contact'

	let name = ''
	let email = ''
	let loading = false
	let success = false
	let errorMsg = ''

	onMount(() => {
		try {
			const raw = window.localStorage.getItem(storageKey)
			if (!raw) return

			const parsed = JSON.parse(raw)
			name = parsed?.name || ''
			email = parsed?.email || ''
		} catch (error) {
			console.error('Unable to load sponsor lead contact info', error)
		}
	})

	async function submitLead() {
		if (loading) return

		errorMsg = ''
		loading = true

		try {
			await trpc().sponsor.capturePublicLead.mutate({
				sponsorId,
				name,
				email,
				source: 'qr',
			})

			window.localStorage.setItem(
				storageKey,
				JSON.stringify({
					name,
					email,
				}),
			)
			success = true
		} catch (error) {
			console.error('Unable to capture sponsor lead', error)
			errorMsg = 'We could not save your info right now. Please try again.'
		} finally {
			loading = false
		}
	}
</script>

<div class="mb-6 rounded-2xl border border-rose-100 bg-rose-50/70 p-5 text-slate-700">
	<div class="text-lg font-semibold text-slate-900">Interested in {sponsorName}?</div>
	<p class="mt-2 text-sm leading-6 text-slate-600">
		Add your contact information below, we'll send you an email with some more information and
		they'll reach out to say hello.
	</p>

	{#if success}
		<div class="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">
			Thanks, you're all set. Your info is saved on this device, so future sponsor QR scans should
			only take one tap.
		</div>
	{:else}
		<form
			class="mt-4 flex flex-col gap-3"
			on:submit|preventDefault={submitLead}
		>
			<input
				bind:value={name}
				required
				placeholder="Name"
				class="h-11 rounded-xl border border-rose-100 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-rose-300"
			/>
			<input
				bind:value={email}
				required
				type="email"
				placeholder="Email"
				class="h-11 rounded-xl border border-rose-100 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-rose-300"
			/>
			{#if errorMsg}
				<div class="text-sm text-red-600">{errorMsg}</div>
			{/if}
			<Button
				type="submit"
				disabled={loading}
				class="h-11 rounded-xl bg-rose-600 text-sm hover:bg-rose-500"
			>
				{loading ? 'Saving...' : 'Heart Sponsor'}
			</Button>
		</form>
	{/if}
</div>
