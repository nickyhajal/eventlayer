<script lang="ts">
  let className = ''
  export { className as class }
  export let open = false
  export let color = 'gray-700'
  export let bg = 'transparent'
</script>

<button
  class={`hamburger grid items-center justify-center text-${color} bg-${bg} border-0 outline-none ${className}`}
  class:open
  on:click={() => (open = !open)}
>
  <svg
    width="18"
    class="mx-auto fill-current"
    height="10"
    viewBox="0 0 18 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M0.599976 1.4002C0.599976 0.737459 1.13724 0.200195 1.79998 0.200195H16.2C16.8627 0.200195 17.4 0.737459 17.4 1.4002C17.4 2.06293 16.8627 2.6002 16.2 2.6002H1.79998C1.13724 2.6002 0.599976 2.06293 0.599976 1.4002Z"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M0.599976 8.60039C0.599976 7.93763 1.13724 7.40039 1.79998 7.40039H16.2C16.8627 7.40039 17.4 7.93763 17.4 8.60039C17.4 9.26315 16.8627 9.80039 16.2 9.80039H1.79998C1.13724 9.80039 0.599976 9.26315 0.599976 8.60039Z"
    />
  </svg>
  <svg
    width="14"
    height="15"
    class="mx-auto fill-current"
    viewBox="0 0 14 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M1.06029 13.3399C0.591664 12.8713 0.591664 12.1115 1.06029 11.6428L11.2426 1.4605C11.7113 0.991855 12.4711 0.991872 12.9397 1.4605C13.4083 1.92912 13.4083 2.68891 12.9397 3.15755L2.75735 13.3399C2.28872 13.8085 1.52891 13.8085 1.06029 13.3399Z"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M1.06029 1.66069C1.52893 1.19205 2.28872 1.19207 2.75734 1.66069L12.9397 11.843C13.4083 12.3117 13.4083 13.0714 12.9397 13.5401C12.471 14.0087 11.7113 14.0087 11.2426 13.5401L1.06029 3.35775C0.591661 2.88912 0.591644 2.12933 1.06029 1.66069Z"
    />
  </svg>
</button>

<style>
  svg {
    grid-area: 1 / 1 / 1 / 1;
  }
  /* button {
    height: 0.7rem;
  } */
  button > div {
    height: 2.4px;
    border-radius: 4px;
    width: 1.2rem;
    background: #8d97a6;
    transition: all 0.2s;
    opacity: 1;
  }
  .open path {
    transition: all 0.2s;
  }
  svg {
    transition: all 0.2s;
  }
  :not(.open) svg:nth-child(2) {
    opacity: 0;
  }
  .open svg:nth-child(2) {
    opacity: 1;
  }
  .open svg:nth-child(1) {
    opacity: 0;
  }
  /* .open path:nth-child(1) {
    transform-origin: center;
    transform: translateY(0) rotate(45deg);
  }
  .open path:nth-child(2) {
    transform-origin: center;
    transform: translateY(0) rotate(-45deg);
  } */
</style>
