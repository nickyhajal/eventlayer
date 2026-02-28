<script>
	import Editor from 'cl-editor/src/Editor.svelte'

	export let value
</script>

<div class="editor" on:mouseover on:mouseout on:focus on:blur>
	<Editor
		html={value}
		on:change={(evt) => (value = evt.detail)}
		actions={[
			'a',
			'b',
			'i',
			'u',
			'strike',
			'h1',
			'h2',
			'p',
			'ul',
			'ol',
			'blockquote',
			'removeFormat',
		]}
	/>
</div>

<style lang="postcss">
	.editor :global(.cl-button > svg) {
		@apply mx-auto;
	}
	.editor :global(.cl-button) {
		@apply opacity-40 transition-opacity duration-200 hover:opacity-80;
	}
	.editor :global(.cl-actionbar) {
		@apply border-greengray-75 border-0;
	}
	.editor :global(.cl) {
		@apply border-greengray-75 overflow-hidden rounded-lg border-2 shadow-none;
	}
	.editor :global(.cl-editor-modal) {
		@apply font-body grid;
	}
	.editor :global(.cl-content h1) {
		@apply font-display text-2xl font-medium leading-snug;
	}
	.editor :global(.cl-content h2) {
		@apply font-body text-xl font-medium leading-snug;
	}
	.editor :global(.cl-content p) {
		@apply font-body text-base font-normal leading-snug;
	}
	.editor :global(.cl-content ul) {
		@apply ml-8 list-outside list-disc;
	}
	.editor :global(.cl-content ol) {
		@apply ml-8 list-outside list-decimal;
	}
</style>
