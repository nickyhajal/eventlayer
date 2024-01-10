<script lang="ts">
	import Dropzone from '$lib/components/form/Dropzone.svelte'
	import type { ActionType, Upload } from '@matterloop/types'
	import { HeroIcon } from '@matterloop/ui'
	import type { action_submission } from '@prisma/client'
	import { ExclamationCircle } from '@steeze-ui/heroicons'
	export let placeholder =
		"Drop Photos Here or <div class='text-blue inline underline'>Browse Files</div>"
	export { className as class }
	export let showPreview = true
	export let attachToFeedItemId = ''
	export let allowEditing = true
	export let loadExisting = true
	export let allowUrl = false
	export let action: ActionType
	export let submission: action_submission
	export let value = ''

	let uploads: Upload[] = []
	let type = 'Action'

	$: {
		value = uploads.map((upload) => upload.uuid).join(',')
	}

	let shouldMarkComplete = true
</script>

<h3
	class="text-black-300 mb-3 mt-6 flex flex-col gap-4 rounded-xl border-2 border-orange-500/10 bg-yellow-50/40 px-10 py-5 text-base"
>
	<div class="flex items-center gap-2">
		<HeroIcon src={ExclamationCircle} class="h-6 w-5 text-orange-600/40" />
		<h4 class="text-sm font-bold uppercase tracking-wide text-orange-600/60">
			{shouldMarkComplete ? `Acceptable Uploads for This ${type}` : `Recommended for This ${type}`}
		</h4>
	</div>
	<div>
		<span class="justify-start text-left text-[0.96rem] font-semibold text-black/60">
			{shouldMarkComplete
				? action.proofDescription ||
				  `Upload a photo or screenshot that proves you've completed this ${type}.`
				: `Upload a screenshot or image that shows your progress on this ${type}`}
		</span>
	</div>
</h3>
<Dropzone
	placeholder={placeholder}
	parent={{ type: 'action_submission', id: submission.id }}
	showPreview
	bind:uploads={uploads}
/>
