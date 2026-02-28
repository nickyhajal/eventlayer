<script lang="ts">
	import { getStores, navigating, page } from '$app/stores'
	import { createEventDispatcher } from 'svelte'

	let className = ''
	const dispatch = createEventDispatcher()
	export let getProps = false
	export { className as class }
	export let to = ''
	export let style = ''
	function mergeProps(...args) {
		let base = { class: 'link ' + ' ' + className, style }
		if (getProps) {
			const { class: classes, style, ...props } = getProps(...args)
			base.class = `${base.class} ${classes}`
			base.style = { ...base.style, ...style }
			base = { ...base, ...props }
		}
		return base
	}
	function getLocation() {
		return {
			pathname: $page.url.pathname,
			path: $page.url.pathname,
			hash: typeof window !== 'undefined' ? window.location.hash : '',
		}
	}
	function getHref() {
		return typeof window !== 'undefined' ? window.location.href : ''
	}
	function getCurrent() {
		return to === $page.url.pathname
	}
	function getPartiallyCurrent() {
		return $page.url.pathname.indexOf(to) === 0 || to.indexOf($page.url.pathname) === 0
	}
</script>

<a
	{...mergeProps({
		location: getLocation(),
		href: getHref(),
		isPartiallyCurrent: getPartiallyCurrent(),
		isCurrent: getCurrent(),
	})}
	href={to}
	on:click={(e) => dispatch('click', e)}
>
	<slot />
</a>
