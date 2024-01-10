<script lang="ts">
  import Hexagon from "src/svg/Hexagon.svelte";

  export let className = ''
  export let number = ''
  export let numberClassName = ''
</script>

<div class={`relative inline-flex ${className}`}>
  <Hexagon />
  <span class={`absolute top-0 left-0 text-xl hexagon-number ${numberClassName}`}>{number}</span>
</div>

<style>
  .hexagon-number {
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
    color: #dc7c10;
    font-weight: bold;
  }
</style>
