<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import * as Avatar from '$lib/components/ui/avatar/index.js'

import type { Media, User } from '@matterloop/db'
import { tw } from '@matterloop/ui'
import { getMediaUrl } from '@matterloop/util'

let className = ''
export { className as class }
export let user: User & { photo: Media }
</script>

<Avatar.Root class={tw(`h-20 w-20 ${className}`)}>
	<Avatar.Image
		src={getMediaUrl(user.photo, '&w=256&h=256&func=face&face_margin=40')}
		alt="@shadcn"
		class="object-cover"
	/>
	<Avatar.Fallback class="text-2xl font-light text-slate-500"
		>{user.firstName[0]}{user.lastName[0]}</Avatar.Fallback
	>
</Avatar.Root>
