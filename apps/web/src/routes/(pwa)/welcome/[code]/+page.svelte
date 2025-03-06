<script lang="ts">
	import { browser } from '$app/environment'
	import NdBase from '$lib/components/NDBase.svelte'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import Input from '$lib/components/ui/input/input.svelte'
	import { getMeContext } from '$lib/state/getContexts'
	import { trpc } from '$lib/trpc/client.js'
	import { onMount } from 'svelte'

	import { plural } from '@matterloop/util'

	export let data
	let claimStatus = 'ready'
	let status = 'ready'
	let error = ''
	let newAssignee = {
		firstName: '',
		lastName: '',
		email: '',
	}
	const user = getMeContext()
	if (!$user) {
		location.reload()
	}
	if (browser && data.success) {
		navigator?.serviceWorker?.getRegistrations()?.then((registrations) => {
			for (const registration of registrations) {
				registration.unregister()
			}
		})
	}
	const tickets = data.tickets
	$: numTickets = tickets?.length || 0
	$: claimable = tickets?.filter((ticket) => !ticket.assignedTo)
	$: numClaimable = claimable?.length || 0
	$: selfClaimed = tickets?.find((ticket) => ticket.assignedTo === $user?.id)
	$: numClaimed = numTickets - numClaimable
	$: if (selfClaimed) {
		claimStatus = 'others'
	}

	onMount(async () => {
		setTimeout(() => {
			selfClaimed = tickets?.find((ticket) => ticket.assignedTo === $user?.id)
		}, 1000)
	})

	async function handleSelfClaim() {
		if (status !== 'ready') {
			return
		}
		const ticketIndex = tickets?.findIndex((ticket) => !ticket.assignedTo)
		if (typeof ticketIndex !== 'number' || ticketIndex === -1 || !tickets) {
			return
		}
		try {
			status = 'saving'
			const updatedTicket = await trpc().event.assignTicket.mutate({
				ticketId: tickets[ticketIndex].id,
				userId: $user?.id,
			})
			status = 'success'
			setTimeout(() => {
				status = 'ready'
				tickets[ticketIndex] = updatedTicket.ticket
				claimStatus = 'others'
			}, 1000)
			if (!updatedTicket) {
				return
			}
		} catch (e) {
			status = 'ready'
			error = e.message
			console.log('error', e.message)
			console.log(e)
			if (e instanceof Error) {
			} else {
				error = 'An unknown error occurred'
			}
			setTimeout(() => {
				error = ''
			}, 5000)
		}
	}
	async function handleSubmit(event: Event) {
		event.preventDefault()
		if (status !== 'ready') {
			return
		}
		if (!newAssignee.firstName || !newAssignee.lastName || !newAssignee.email) {
			error = 'Please fill in all fields'
			setTimeout(() => {
				error = ''
			}, 3000)
			return
		}
		const ticketIndex = tickets?.findIndex((ticket) => !ticket.assignedTo)
		if (typeof ticketIndex !== 'number' || ticketIndex === -1 || !tickets) {
			return
		}
		try {
			status = 'saving'
			console.log('assigning ticket', tickets[ticketIndex])
			const updatedTicket = await trpc().event.assignTicket.mutate({
				ticketId: tickets[ticketIndex].id,
				firstName: newAssignee.firstName,
				lastName: newAssignee.lastName,
				email: newAssignee.email,
			})
			if (!updatedTicket) {
				return
			}
			tickets[ticketIndex] = updatedTicket.ticket
			status = 'success'
			newAssignee = {
				firstName: '',
				lastName: '',
				email: '',
			}
			setTimeout(() => {
				status = 'ready'
			}, 2000)
		} catch (e) {
			if (e instanceof Error) {
				error = e.message
			} else {
				error = 'An unknown error occurred'
			}
			setTimeout(() => {
				error = ''
			}, 5000)
		}
	}
</script>

<div class="pt-6">
	<NdBase />
	<div
		class="wrap mx-auto font-bold py-2.5 text-center fixed top-0 bg-white/30 z-10 border-b-2 border-slate-200/50 text-sm uppercase text-slate-600 tracking-wide w-full"
	>
		Assign Your {data.event.name}
		{plural(numTickets, 'ticket')}
	</div>
	{#if data.error}
		<div class="wrap mx-auto max-w-md p-4">That code isn't valid</div>
	{:else}
		<div class="text-3xl md:-mt-4 mb-10 w-full text-center font-bold max-w-md mx-auto">
			{#if numTickets > 0 && numClaimable === 0}
				You're all set!
			{:else if numTickets === 1}
				Hey, {$user.firstName}! You have 1 ticket to claim or assign.
			{:else if numTickets > 1}
				{#if numClaimable === numTickets}
					<div class="">
						Hey, {$user.firstName}! You have {numClaimable}
						{plural(numClaimable, 'ticket')} to claim
					</div>
				{:else}
					<div class="">
						Hey, {$user.firstName}! You have {numClaimable}
						{plural(numClaimable, 'ticket')} left to claim
					</div>
				{/if}
			{/if}
		</div>
		<div class="wrap mx-auto max-w-md p-4">
			<div
				class="text-center font-semibold bg-slate-200/20 p-6 rounded-xl flex flex-col gap-4 relative z-10"
			>
				{#if numTickets === 0}
					<div class="text-center text-2xl font-semibold">No tickets found</div>
				{:else if claimStatus === 'ready' && numClaimable > 0}
					<div class="text-xl">
						Is {numTickets === 1 ? 'this' : 'one of these'}
						{plural(numTickets, 'ticket')} for you?
					</div>
					<p class="text-lg font-medium">
						If you're planning to attend {data.event.name}, claim your ticket below.
					</p>
					<div class="flex flex-col gap-2">
						<button
							class="text-lg bg-black text-white px-4 py-3 border-2 border-black rounded-full"
							type="button"
							on:click={() => handleSelfClaim()}
							disabled={status === 'saving'}
						>
							{status === 'saving'
								? 'Claiming...'
								: status === 'success'
									? 'Success!'
									: 'Claim for Me'}
						</button>
						<button
							class="text-lg bg-slate-200 px-4 py-3 border-0 !text-slate-700 rounded-full"
							type="button"
							on:click={() => (claimStatus = 'others')}
							disabled={status === 'saving'}
						>
							Assign to someone else
						</button>
					</div>
				{:else if numClaimable > 0}
					{#if numClaimed > 0}
						<div class="text-center text-xl font-semibold">Assign your next ticket</div>
					{:else}
						<div class="text-center text-xl font-semibold">Assign your ticket</div>
					{/if}
					<form on:submit={handleSubmit}>
						<div class="flex flex-col gap-2">
							<div
								class="{status === 'ready'
									? 'opacity-100'
									: 'opacity-20 pointer-events-none'} transition-all flex flex-col gap-2"
							>
								<div class="div flex gap-2 pt-2">
									<Input
										name="firstName"
										class="text-lg bg-white text-black px-4 py-6 border-2 border-black rounded-full"
										bind:value={newAssignee.firstName}
										placeholder="First Name"
									/>
									<Input
										class="text-lg bg-white text-black px-4 py-6 border-2 border-black rounded-full"
										name="lastName"
										bind:value={newAssignee.lastName}
										placeholder="Last Name"
									/>
								</div>
								<Input
									name="email"
									class="text-lg bg-white text-black px-4 py-6 border-2 border-black rounded-full"
									bind:value={newAssignee.email}
									placeholder="Email"
								/>
							</div>
							<Button
								type="submit"
								class="text-lg bg-black text-white px-4 py-6 border-2 border-black rounded-full"
								>{status === 'saving'
									? 'Assigning...'
									: status === 'success'
										? 'Success!'
										: 'Assign Ticket'}</Button
							>
						</div>
					</form>
				{:else}
					<div class="text-center text-xl font-medium">
						{#if selfClaimed}
							<div>
								{#if numTickets === 1}
									<span class="">Your ticket has been claimed! </span>
								{:else}
									<span class="">Your tickets are all assigned! </span>
								{/if}
								<span>Now let's complete your registration.</span>
							</div>
							<Button
								href="/welcome"
								class="text-lg bg-black text-white px-4 py-6 w-full mt-6 border-2 border-black rounded-full"
								>Continue</Button
							>
						{:else}
							<div>
								The people you've assigned tickets to will receive an email with further
								instructions.
							</div>
						{/if}
					</div>
				{/if}
			</div>
			{#if error}
				<div
					class="text-red-700/70 bg-red-50 rounded-b-xl px-4 -mt-4 pt-8 font-semibold relative z-0 py-4 text-center text-lg"
				>
					{error}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.bg-image {
		background-image: url('https://framerusercontent.com/images/EErxJcrmRQPI1Li7WAZRMIU.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}
</style>
