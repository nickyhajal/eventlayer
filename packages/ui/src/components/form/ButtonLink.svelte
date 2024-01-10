<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Link from '../Link.svelte'

  const dispatch = createEventDispatcher()
  export let to = ''
  let focused = false
</script>

<Link getProps={() => ({ class: 'button' })} {to} on:click={(e) => dispatch('click', e)}>
  <slot />
</Link>

<style lang="postcss">
  :global(.button) {
    display: block;
    border: 0;
    @apply bg-purple rounded-2xl text-white;
    padding: 1rem;
    text-transform: uppercase;
    font-weight: 600;
    font-size: 0.9375rem;
    width: 100%;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
  }
</style>
