<script lang="ts">
	import Image from './Image.svelte'
	import { dayjs, ordinal, getMediaUrl, IMedia } from '@matterloop/util'
	import { createEventDispatcher } from 'svelte'

	// import { getCommunityContext } from '$lib/state/getContexts'
	interface User {
		id: string
		photo: IMedia
	}
	export let size = '3'
	export let photo: string | null = ''
	export let user: Partial<User> = {}
	export let version = '1'
	export let hasOnline: boolean = false
	export let place = 0
	export let flairSize = '3'
	let className = ''
	export { className as class }

	const dispatch = createEventDispatcher()
	// $: community = getCommunityContext()
	$: photoObj = photo ? photo : !photo && user?.photo ? getMediaUrl(user.photo) : ''
	$: photoUrl = typeof photoObj === 'string' ? photoObj : getMediaUrl(photoObj)
	$: url = photoUrl ? photoUrl : '/images/default-avatar.png'
	$: sizeNum = parseInt(size, 10)

	function userActive() {
		// if (user) {
		//   const boardUser = $community?.usersById?.[user?.id || '']
		//   if (boardUser && boardUser.lastLogin) {
		//     return dayjs().diff(dayjs(boardUser.lastLogin), 'minute') < 7
		//   }
		// }
		return false
	}
</script>

{#if url}
	<a
		href={`/user/${user?.id}`}
		class={`block h-11 w-11  flex-none rounded-full `}
		style={`width: ${size}rem; height: ${size}rem;`}
	>
		<div
			class={`relative h-full w-full flex-none ${user ? 'cursor-pointer' : ''}`}
			on:click={(e) => user && dispatch('openUserProfile', { user })}
			on:keypress={(e) => user && dispatch('openUserProfile', { user })}
		>
			{#if place}
				<div
					class="absolute -top-2 right-2 flex items-center justify-center rounded-full bg-white p-1 text-sm font-semibold italic text-slate-800"
				>
					{ordinal(place)}
				</div>
			{/if}
			<div
				class={`shell avatar border-bluegray flex-none overflow-hidden rounded-full border-2 ${className} h-full w-full`}
			>
				<Image
					class="object-cover"
					src={`${url}${
						url.includes('resultjam')
							? `?w=${sizeNum * 16}&h=${
									sizeNum * 16
							  }&crop=faces,center&fit=crop&ar=1:1&version=${version}`
							: ''
					}`}
					base="/images/default-avatar.png"
				/>
				{#if hasOnline && userActive()}
					<div
						class={`absolute bottom-0 right-0 bg-emerald-500 w-${flairSize} h-${flairSize} rounded-full`}
					/>
				{/if}
			</div>
		</div>
	</a>
{/if}

<style lang="postcss">
	.shell {
		background: #ccc;
		transition: all 200ms;
		img {
			width: 100%;
			height: 100%;
		}
	}
</style>
