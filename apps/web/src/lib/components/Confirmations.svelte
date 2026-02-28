<script>
	import { confirmations } from '$lib/util/confirmationDialogs'

	import ConfirmationModal from './ConfirmationModal.svelte'
</script>

{#each $confirmations.stack as confirmation}
	<ConfirmationModal {...confirmation} />
{/each}
