<script lang="ts">
  import showdown from 'showdown'
  let className = ''
  export let data: string
  export { className as class }
  const converter = new showdown.Converter({
    simplifiedAutoLink: true,
    openLinksInNewWindow: true,
  })
  $: html = converter.makeHtml(data)?.replaceAll('&nbsp;', ' ') || ''
</script>

<div class="md-shell {className}">
  {@html html}
</div>

<style lang="postcss">
  div {
    :global(a:not(.special-interactor)) {
      @apply text-blue-500;
      text-decoration: underline;
      word-break: break-all;
    }
  }
    .md-shell :global(p) {
      @apply mb-3;
    }
    li {
      @apply list-disc;
    }
</style>
