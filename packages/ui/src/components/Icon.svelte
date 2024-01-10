<script lang="ts">
  let className = ''
  export { className as class }
  export let icon
  export let style
  export let addClass = ''
  export let opacity
  export let x
  export let y
</script>

{#if icon}
  {#if icon === 'check'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="14"
      height="11"
      viewBox="0 0 14 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        {opacity}
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M4.32199 8.6987L1.42256 5.72852C1.09669 5.39469 0.570277 5.39469
        0.244405 5.72852C-0.0814682 6.06234 -0.0814682 6.6016 0.244405
        6.93542L3.73709 10.5133C4.06297 10.8472 4.58938 10.8472 4.91525
        10.5133L13.7556 1.45727C14.0815 1.12345 14.0815 0.584193 13.7556
        0.250369C13.4297 -0.0834562 12.9033 -0.0834562 12.5774 0.250369L4.32199
        8.6987Z"
        fill="white"
      />
    </svg>
  {:else if icon === 'close'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.6663 1.33301L1.33301 10.6663"
        stroke="#909597"
        stroke-width="2"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10.6663 10.6663L1.33301 1.33301"
        stroke="#909597"
        stroke-width="2"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  {:else if icon === 'plus'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="11"
      height="11"
      preserveAspectRatio="none"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        {opacity}
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10.5 6H6V10.5H4.5V6H0V4.5H4.5V0H6V4.5H10.5V6Z"
        fill="#2D2D2D"
      />
    </svg>
  {:else if icon === 'lock'}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
    >
      <path
        fill-rule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clip-rule="evenodd"
      />
    </svg>
  {:else if icon === 'locked'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="13"
      height="16"
      viewBox="0 0 13 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.5" clip-path="url(#clip0)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.6667 5.33333H9.90476V3.80952C9.90476 1.70667 8.1981 0 6.09524
          0C3.99238 0 2.28571 1.70667 2.28571 3.80952V5.33333H1.52381C0.685714
          5.33333 0 6.01905 0 6.85714V14.4762C0 15.3143 0.685714 16 1.52381
          16H10.6667C11.5048 16 12.1905 15.3143 12.1905 14.4762V6.85714C12.1905
          6.01905 11.5048 5.33333 10.6667 5.33333ZM3.80952 3.80952C3.80952
          2.54476 4.83048 1.52381 6.09524 1.52381C7.36 1.52381 8.38095 2.54476
          8.38095 3.80952V5.33333H3.80952V3.80952Z"
          fill="#5EC49F"
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="12.1905" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  {:else if icon === 'small-like'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="15"
      height="12"
      viewBox="0 0 15 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.9625 0.418807L4.68467 3.69664C4.46575 3.91556 4.3415 4.21731
        4.3415 4.53089V10.4416C4.3415 11.0925 4.874 11.625 5.52484
        11.625H10.8498C11.3232 11.625 11.7492 11.341 11.9385 10.9091L13.8673
        6.40647C14.3643 5.23497 13.5064 3.93331 12.2343 3.93331H8.89142L9.45351
        1.22347C9.51267 0.92764 9.42392 0.62589 9.21092 0.41289C8.86184
        0.0697235 8.30567 0.0697235 7.9625 0.418807ZM1.97484 11.625C2.62567
        11.625 3.15817 11.0925 3.15817 10.4416V5.70831C3.15817 5.05747 2.62567
        4.52497 1.97484 4.52497C1.324 4.52497 0.791504 5.05747 0.791504
        5.70831V10.4416C0.791504 11.0925 1.324 11.625 1.97484 11.625Z"
      />
    </svg>
  {:else if icon === 'fire'}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      class={`icon ${addClass} ${className} h-6 w-6 opacity-50`}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
      />
    </svg>
  {:else if icon === 'like'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="23"
      height="20"
      viewBox="0 0 23 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.7297 1.02775L6.42793 6.79611C6.07384 7.18136 5.8855 7.69975
        5.90782 8.22928L6.32847 18.2104C6.37479 19.3094 7.31189 20.1708 8.41091
        20.1244L17.4029 19.7455C18.2022 19.7118 18.9014 19.2019 19.1903
        18.4591L22.127 10.7185C22.8829 8.70493 21.3416 6.56793 19.1935
        6.65846L13.5485 6.89637L14.3048 2.28043C14.3836 1.77666 14.2123 1.27343
        13.8374 0.92891C13.2236 0.374268 12.2844 0.413849 11.7297
        1.02775V1.02775ZM2.41623 20.3771C3.51526 20.3308 4.37656 19.3937 4.33025
        18.2946L3.99339 10.3017C3.94707 9.20271 3.00997 8.3414 1.91094
        8.38772C0.81192 8.43404 -0.0493851 9.37114 -0.00306682 10.4702L0.333793
        18.4631C0.380111 19.5621 1.31721 20.4234 2.41623 20.3771Z"
      />
    </svg>
  {:else if icon === 'comment'}
    <svg
      {style}
      class={`icon ${addClass} ${className} inline align-top`}
      width="17"
      height="20"
      viewBox="0 0 17 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.7 0.422852C0.7616 0.422852 0 1.2662 0 2.30744V13.615C0 14.6553
        0.7616 15.4996 1.7 15.4996H4.25V19.2687L7.65 15.4996H15.3C16.2393
        15.4996 17 14.6553 17 13.615V2.30744C17 1.2662 16.2393 0.422852 15.3
        0.422852H1.7Z"
      />
    </svg>
  {:else if icon === 'chevron-left'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="18"
      height="24"
      viewBox="0 0 18 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 0H9.13171L0 12L9.13171 24H18L8.4878 12L18 0Z" fill="#5EC49F" />
    </svg>
  {:else if icon === 'chevron-right'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="18"
      height="24"
      viewBox="0 0 18 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0H8.86829L18 12L8.86829 24H0L9.5122 12L0 0Z" fill="#5EC49F" />
    </svg>
  {:else if icon === 'swap'}
    <svg
      {x}
      {y}
      {style}
      class={`icon ${addClass} ${className}`}
      width="20"
      height="18"
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 9V12C20 13.0609 19.5786 14.0783 18.8284 14.8284C18.0783 15.5786
        17.0609 16 16 16H5V17C4.99907 17.1801 4.94953 17.3566 4.85661
        17.5108C4.76369 17.6651 4.63083 17.7914 4.47208 17.8764C4.31332 17.9614
        4.13455 18.002 3.95465 17.9938C3.77475 17.9856 3.6004 17.929 3.45
        17.83L0.45 15.83L0.33 15.73C0.252145 15.6511 0.187937 15.5599 0.14
        15.46V15.39C0.0940703 15.2808 0.0704114 15.1635 0.0704114
        15.045C0.0704114 14.9265 0.0940703 14.8092 0.14 14.7V14.63C0.187937
        14.5301 0.252145 14.4388 0.33 14.36L0.45 14.26L3.45 12.26C3.59409 12.164
        3.76062 12.1071 3.9333 12.0949C4.10598 12.0826 4.27889 12.1153 4.43511
        12.1899C4.59133 12.2645 4.72552 12.3783 4.82454 12.5203C4.92356 12.6623
        4.98402 12.8276 5 13V14H16C16.5304 14 17.0391 13.7893 17.4142
        13.4142C17.7893 13.0391 18 12.5304 18 12V9C18 8.73478 18.1054 8.48043
        18.2929 8.29289C18.4804 8.10535 18.7348 8 19 8C19.2652 8 19.5196 8.10535
        19.7071 8.29289C19.8946 8.48043 20 8.73478 20 9ZM1 10C1.26522 10 1.51957
        9.89464 1.70711 9.7071C1.89464 9.51957 2 9.26521 2 9V6C2 5.46956 2.21071
        4.96085 2.58579 4.58578C2.96086 4.21071 3.46957 4 4 4H15V5C15.0009
        5.18008 15.0505 5.35657 15.1434 5.51083C15.2363 5.66509 15.3692 5.79139
        15.5279 5.8764C15.6867 5.96142 15.8654 6.00198 16.0453 5.99381C16.2252
        5.98564 16.3996 5.92904 16.55 5.83L19.55 3.83L19.67 3.73C19.7443 3.6504
        19.8051 3.5592 19.85 3.46V3.39C19.8959 3.28077 19.9196 3.16348 19.9196
        3.045C19.9196 2.92651 19.8959 2.80922 19.85 2.7V2.63C19.8051 2.5308
        19.7443 2.4396 19.67 2.36L19.55 2.26L16.55 0.259996C16.4059 0.164043
        16.2394 0.10714 16.0667 0.0948531C15.894 0.0825664 15.7211 0.115317
        15.5649 0.189901C15.4087 0.264486 15.2745 0.378348 15.1755
        0.520348C15.0764 0.662348 15.016 0.827621 15 0.999996V2H4C2.93913 2
        1.92172 2.42142 1.17157 3.17157C0.421427 3.92171 0 4.93913 0 6V9C0
        9.26521 0.105357 9.51957 0.292893 9.7071C0.48043 9.89464 0.734784 10 1
        10Z"
        fill="black"
      />
    </svg>
  {:else if icon === 'warn'}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path
        fill-rule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clip-rule="evenodd"
      />
    </svg>
  {/if}
{/if}

<style>
  svg {
    overflow: visible;
  }
</style>
