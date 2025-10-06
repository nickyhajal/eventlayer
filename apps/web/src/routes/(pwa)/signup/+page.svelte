<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation'
	import { superForm } from 'sveltekit-superforms/client'

	import { Button, Input } from '@matterloop/ui'

	export let data

	const { form, validate, enhance, message, errors, allErrors, delayed } = superForm(data.form, {
		onResult: (rsp) => {
			if (rsp.result.status === 200) {
				invalidateAll()
			}
		},
	})
</script>

<div class="shadow-line mx-auto mt-20 w-full max-w-xl rounded-2xl bg-white p-8">
	<h1 class="text-3xl">Sign in</h1>
	<form method="POST" use:enhance>
		{#if $message}
			<div class="message">{$message}</div>
		{/if}
		{#if $allErrors[0]?.messages?.length}
			<div
				class="error mb-2 rounded-lg border border-b-2 border-red-100/50 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
			>
				Invalid email or password
			</div>
		{/if}
		<div class="flex flex-col gap-4">
			<Input id="email" name="email" placeholder="Your Email" bind:value={$form.email} />
			<Input
				id="password"
				name="password"
				type="password"
				placeholder="Password"
				bind:value={$form.password}
			/>
			<Button type="submit" loading={$delayed}>Login</Button>
			<a
				href="/signup"
				class="mt-3 text-center text-sm font-medium text-slate-400 transition-all hover:text-emerald-600"
				>Don't have an account?</a
			>
		</div>
	</form>
</div>
