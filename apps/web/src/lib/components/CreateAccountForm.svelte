<script lang="ts">
import { Fields } from '@matterloop/ui'
import { goto } from '$app/navigation'
import { CREATE_USER_INPUT } from '$lib/constants/fields/USER_FIELDS'
import { isMobile } from '$lib/core/stores'
import { getMeContext } from '$lib/state/getContexts'
import { trpc } from '$lib/trpc/client'
import Error from 'src/routes/settings/+error.svelte'
import { createEventDispatcher } from 'svelte'

const dispatch = createEventDispatcher()
export let redirectOnSuccess: string | false = '/'
let error = ''
let status = 'ready'
const me = getMeContext()
let values = {
	firstName: '',
	lastName: '',
	email: '',
	password: '',
}

export let fieldsWrapperClass = ''

const desktop_fields = [
	[
		{ name: 'firstName', type: 'text', placeholder: 'First Name' },
		{ name: 'lastName', type: 'text', placeholder: 'Last Name' },
	],
	[
		{ name: 'email', type: 'email', placeholder: 'Email Address' },
		{ name: 'password', type: 'password', placeholder: 'Password' },
	],
]
let fields = desktop_fields
$: if ($isMobile) {
	fields = [
		[{ name: 'firstName', type: 'text', placeholder: 'First Name' }],
		[{ name: 'lastName', type: 'text', placeholder: 'Last Name' }],
		[{ name: 'email', type: 'email', placeholder: 'Email Address' }],
		[{ name: 'password', type: 'password', placeholder: 'Password' }],
	]
} else {
	fields = desktop_fields
}

function setError(errorMsg: string, unsetTime = 7500) {
	error = errorMsg
	setTimeout(() => {
		error = ''
	}, unsetTime)
}

async function create() {
	if (status === 'loading') return
	status = 'loading'
	try {
		CREATE_USER_INPUT.parse(values)
		const createRsp = await fetch('/create-account', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(values),
		})
		if (createRsp && createRsp.status !== 200) {
			const json = await createRsp.json()
			status = 'error'
			setError(json.message)
			return
		}
		const rsp = await trpc().me.get.query()
		if (rsp) {
			status = 'success'
			me.set(rsp)
			if (redirectOnSuccess) {
				goto(redirectOnSuccess)
			}
			dispatch('login')
		}
	} catch (e) {
		status = 'error'
		if (e?.issues?.length && e.issues[0].message) {
			setError(e.issues[0].message)
		} else {
			setError(e.message)
		}
	}
}
</script>

<div>
	<form on:submit|preventDefault|stopPropagation={() => create()}>
		<div class={`${fieldsWrapperClass}`}>
			<Fields fields={fields} bind:values={values} />
		</div>
		{#if error}
			<div class="bg-red-75/70 border-b border-red-100/70 p-4 px-52 text-sm text-red-600">
				{error}
			</div>
		{/if}
		<slot status={status} />
	</form>
</div>
