/**
 * Builds the head snippet for dynamically compiled Tailwind. Lives in a plain .ts file so
 * svelte-preprocess never sees `<style>` or `style` string fragments inside a .svelte `<script>`.
 */
export function wrapScreenBackdropCssForHead(compiledCss: string): string {
	if (!compiledCss) return ''
	return `<style data-screen-image-backdrop>${compiledCss}</style>`
}
