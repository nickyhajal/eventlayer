<script lang="ts">
import Button from '$lib/components/ui/button/button.svelte'
import { getEventContext } from '$lib/state/getContexts'
import { post, trpc } from '$lib/trpc/client'
import { Pincode, PincodeInput } from 'svelte-pincode'

export let handleSuccess: undefined | ((id: string) => Promise<void>)
export let handleCreateAccount = () => {}
let firstName = ''
let lastName = ''
let email = ''
let password = ''
let view = 'login'
let code = ''
let justcode = ''
const event = getEventContext()
let codeEmailSent = false
let loading = false

async function submit(e?: Event | undefined) {
	if (loading) return
	if (e) {
		e.preventDefault()
		e.stopPropagation()
	}
	if (view === 'login') {
		if (!code) {
			loading = true
			const res = await trpc().user.sendMagicLinkEmail.mutate({ email })
			trpc().user
			codeEmailSent = true
			loading = false
		} else if (code.length === 4) {
			loading = true
			try {
				const rsp = await post(`login`, { code })
				if (handleSuccess) {
					const me = await trpc().me.get.query()
					if (me) {
						handleSuccess(me.id)
					}
				}
				const data = await rsp.json()
				if (data) {
					window.location.pathname = '/'
					location.href = '/'
				}
			} catch (e) {
				console.log(e)
			} finally {
				loading = false
			}
		}
	} else {
		const rsp = await post(`signup`, {
			email,
			password,
			firstName,
			lastName,
		})
		const data = await rsp.json()
		return data
	}
}

$: if (codeEmailSent && code.length === 4) {
	submit()
}
</script>

<form on:submit|preventDefault|stopPropagation={submit} class="mx-auto w-11/12 pb-10 pt-3">
	{#if view === 'login'}
		<div class="title -mt-2 mb-6 text-center text-2xl font-semibold text-slate-600">
			Sign in to {$event?.name}
		</div>
		{#if !codeEmailSent}
			<div class="pb-8 text-center text-base font-medium leading-tight text-slate-500">
				Enter your email below to get<br /> a magic link to login
			</div>
		{:else}
			<div class="pb-8 text-center text-base font-medium leading-tight text-slate-500">
				Check your email! We sent you a code to login.
			</div>
		{/if}
		<div class="flex flex-col gap-3 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6">
			{#if !codeEmailSent}
				<input
					class="rounded-md border border-slate-200 p-1 focus:outline-sky-300"
					type="email"
					placeholder="Email"
					bind:value={email}
				/>
				<Button class="py-2" loading={loading} type="submit">Send Magic Link</Button>
			{:else}
				<div>
					<div class="text-center text-sm font-medium text-slate-500">Enter your code here</div>
					<div class="pinshell mx-auto flex w-72 justify-center pb-6 pt-4">
						<Pincode bind:value={code}>
							<PincodeInput />
							<PincodeInput />
							<PincodeInput />
							<PincodeInput />
						</Pincode>
					</div>
				</div>
				<Button loading={loading}>Login</Button>
			{/if}
		</div>
		<Button
			on:click={() => handleCreateAccount()}
			class="mx-auto mt-4 h-8 w-40 bg-white px-2 py-2 text-xs text-slate-700 opacity-50 transition-all hover:opacity-100"
			variant="ghost"
			>Or create an account
		</Button>
	{:else}
		<input
			class="rounded-md border border-slate-200 p-1"
			type="text"
			placeholder="First Name"
			bind:value={firstName}
		/>
		<input
			class="rounded-md border border-slate-200 p-1"
			type="text"
			placeholder="Last Name"
			bind:value={lastName}
		/>
		<input
			class="rounded-md border border-slate-200 p-1"
			type="text"
			placeholder="Email"
			bind:value={email}
		/>
		<input
			class="rounded-md border border-slate-200 p-1"
			type="password"
			placeholder="Password"
			bind:value={password}
		/>
		<button>Create Account</button>
	{/if}
</form>

<style lang="postcss">
input {
	@apply px-3.5 py-2;
}
.wrap :global(button) {
	@apply h-12 rounded-lg border border-b-2 border-emerald-200/70 bg-emerald-50 text-sm font-semibold text-emerald-600 hover:bg-emerald-100/80;
}
.pinshell :global(> div) {
	@apply flex gap-1.5;
	border: none;
}
.pinshell :global(> div input) {
	@apply rounded-lg focus:outline-sky-300;
	border: 2px solid #d1d5db70;
}
</style>
