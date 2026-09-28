<script lang="ts">
  import { getEventContext } from "$lib/state/getContexts";

  import { getMediaUrl, isND } from "@matterloop/util";

  const event = getEventContext();
  const ndLogo =
    "https://ik.imagekit.io/vfbggzlfe/prod/event-large-logo/92fdfc3e-501e-4985-b42f-397e584a77dd-1.png?v=1";
  $: logoUrl = $event?.largeLogo
    ? getMediaUrl($event.largeLogo)
    : isND($event)
      ? ndLogo
      : "";
</script>

{#if logoUrl}
  <img src={logoUrl} alt={$event?.name ?? ""} class="mx-auto mb-10 mt-8 w-40" />
{/if}
<!-- Background photo and circles are ND branding -->
{#if isND($event)}
  <div class="fixed left-0 top-0 h-full w-full">
    <div
      class="ball-blue absolute -right-[220px] bottom-[12%] w-72 md:-right-[120px] md:bottom-[20%]"
    ></div>
    <div
      class="ball-oj absolute -left-[150px] top-[8%] w-48 md:-left-[60px] md:top-[12%]"
    ></div>
  </div>
  <div class="bg-image fixed left-0 top-0 z-10 h-full w-full opacity-30"></div>
{/if}

<style>
  .bg-image {
    background-image: url("https://framerusercontent.com/images/EErxJcrmRQPI1Li7WAZRMIU.png");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
  .ball-blue {
    aspect-ratio: 1 / 1;
    background: linear-gradient(
      215.32372915759623deg,
      #22b2d7 0%,
      rgba(46, 208, 195, 1) 100%
    );
    border-radius: 100%;
    flex: none;
    z-index: 1;
  }
  .ball-oj {
    aspect-ratio: 1 / 1;
    background: linear-gradient(
      215.32372915759623deg,
      #dd4b4d 0%,
      rgba(247, 184, 77, 1) 100%
    );
    border-radius: 100%;
    z-index: 1;
  }
</style>
