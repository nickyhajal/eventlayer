<script lang="ts">
  let className = ''
  export { className as class }
</script>

<div class={className}>
  <slot />
</div>

<style lang="postcss">
  div {
    display: grid;
    > :global(*) {
      grid-area: 1 / 1 / 1 / 1;
    }
  }
</style>
