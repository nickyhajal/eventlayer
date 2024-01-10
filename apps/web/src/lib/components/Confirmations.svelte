<script>
  import ConfirmationModal from './ConfirmationModal.svelte'
  import { confirmations } from '$lib/util/confirmationDialogs'
</script>

{#each $confirmations.stack as confirmation}
  <ConfirmationModal {...confirmation} />
{/each}
