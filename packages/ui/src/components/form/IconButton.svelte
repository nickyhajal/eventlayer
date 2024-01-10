<script lang="ts">
  import IoIosAdd from 'svelte-icons/io/IoIosAdd.svelte'
  import Button from './Button.svelte'

  export let icon
</script>

<div>
  <button color="blank" on:click|stopPropagation>
    <div>
      <div class="icon">
        {#if icon === 'add'}
          <IoIosAdd />
        {/if}
      </div>
    </div>
    <slot />
  </button>
</div>

<style lang="postcss">
  div {
    button > div {
      float: left;
      padding: 0.1rem 0.2rem 0.12rem;
      margin-right: 0.7rem;
    }
    button .icon {
      width: 1.45rem;
      height: 1.45rem;
    }
    button {
      position: relative;
      top: 0.3rem;
      display: flex;
      align-items: center;
      border: 1px solid #f0f0f0;
      box-sizing: border-box;
      box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.05);
      border-radius: 3px;
      height: max-content;
      width: max-content;
      transition: all 150ms;
      padding: 0 0.7rem 0 0rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      cursor: pointer;
    }
    button:hover {
      box-shadow: 3px 3px 8px rgba(126, 78, 78, 0.06);
    }
    button:hover > div {
    }
    button:hover .icon {
    }
  }
</style>
