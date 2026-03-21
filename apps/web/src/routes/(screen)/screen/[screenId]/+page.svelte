<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import Ably from "ably";

  import { dayjs, getMediaUrl } from "@matterloop/util";

  import { wrapScreenBackdropCssForHead } from "$lib/screen/wrapScreenBackdropCssForHead";
  import { getEventContext } from "$lib/state/getContexts";

  export let data;
  const event = getEventContext();
  $: showBanner =
    data.effective.notificationEnabled && data.effective.notificationMessage;
  $: isTopBanner = data.effective.notificationPosition !== "bottom";

  $: imageBackdropHeadHtml = wrapScreenBackdropCssForHead(
    data.imageModeBackdropCss,
  );

  function getCardImage(event: any) {
    const media = event?.photo ?? event?.venue?.photo;
    return media ? getMediaUrl(media) : "";
  }

  function getMainLogoUrl() {
    const largeLogo = $event?.darkLogo;
    return largeLogo ? getMediaUrl(largeLogo, "w-100") : "";
  }

  onMount(() => {
    let refreshing = false;
    const client = new Ably.Realtime({
      authUrl: "/ably/token",
    });
    const channel = client.channels.get(data.screensChannel);
    const dataListener = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await invalidateAll();
      } finally {
        refreshing = false;
      }
    };
    const hardRefreshListener = () => {
      window.location.reload();
    };
    channel.subscribe("screens-updated", dataListener);
    channel.subscribe("screen-hard-refresh", hardRefreshListener);
    return () => {
      channel.unsubscribe("screens-updated", dataListener);
      channel.unsubscribe("screen-hard-refresh", hardRefreshListener);
      client.close();
    };
  });
</script>

<svelte:head>
  <title>{data.event.name} | Screen {data.screen.key}</title>
  {#if imageBackdropHeadHtml}
    {@html imageBackdropHeadHtml}
  {/if}
</svelte:head>

<main
  class="relative isolate flex min-h-screen flex-col overflow-hidden bg-slate-800 text-slate-100"
>
  <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <div class="absolute inset-0 bg-slate-800"></div>
    {#if data.imageModeBackdropClassNames}
      <div
        class="absolute inset-0 opacity-60 {data.imageModeBackdropClassNames}"
      ></div>
    {/if}
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.34))]"
    ></div>
  </div>

  {#if showBanner && isTopBanner}
    <div
      class="relative z-10 border-b border-amber-200/40 bg-amber-200 px-6 py-4 text-center text-2xl font-semibold text-slate-900"
    >
      {data.effective.notificationMessage}
    </div>
  {:else}
    <div class="relative z-10 text-5xl font-semibold tracking-tight">
      {#if getMainLogoUrl()}
        <img alt="" src={getMainLogoUrl()} class="mt-4 -mb-4 mx-auto" />
      {/if}
    </div>
  {/if}

  {#if data.effective.mode === "message"}
    <div
      class="relative z-10 flex min-h-[calc(100vh-2rem)] items-center justify-center px-10 py-10"
    >
      <div
        class="max-w-6xl text-center text-6xl font-semibold leading-tight lg:text-8xl"
      >
        {data.effective.messageBody || "Welcome"}
      </div>
    </div>
  {:else if data.effective.mode === "image" || data.effective.mode === "logo"}
    <div
      class="relative z-10 flex min-h-screen w-full flex-1 flex-col items-center justify-center px-10 py-10 text-slate-100"
    >
      {#if data.effective.imageUrl?.trim()}
        <img
          alt=""
          role="presentation"
          src={data.effective.imageUrl.trim()}
          class="max-h-[min(50vh,28rem)] max-w-[min(85vw,36rem)] object-contain"
          referrerpolicy="no-referrer"
        />
      {:else}
        <div
          class="max-w-3xl text-center text-3xl font-semibold text-slate-300"
        >
          No image URL configured. Set it under Manage → Screens (image mode).
        </div>
      {/if}
    </div>
  {:else}
    <div class="relative z-10 px-8 py-8">
      <div class="mb-8 justify-center flex items-center gap-10 text-center">
        <div class="mt-2 text-slate-100 font-semibold text-5xl">
          What's Happening
        </div>
      </div>

      {#if data.upcoming?.length}
        <div class="mx-auto flex flex-wrap justify-center gap-6">
          {#each data.upcoming as event}
            <div
              class="overflow-hidden rounded-2xl flex-none {data.upcoming
                .length > 4
                ? 'w-[30%]'
                : 'w-[40%]'} border border-slate-700 bg-slate-900 shadow-xl"
            >
              {#if getCardImage(event)}
                <img
                  alt={event.name}
                  src={getCardImage(event)}
                  class="h-56 w-full object-cover"
                />
              {/if}
              <div class="space-y-2 p-5">
                <div class="text-3xl font-semibold line-clamp-2 leading-tight">
                  {event.name}
                </div>
                <div class="text-2xl text-slate-200">
                  {dayjs(event.startsAt).format("h:mma")} at {event.venue
                    ?.name || "TBA"}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="rounded-2xl border border-slate-700 bg-slate-900 p-12 text-center text-3xl text-slate-300"
        >
          No upcoming events to display.
        </div>
      {/if}
    </div>
  {/if}

  {#if showBanner && !isTopBanner}
    <div
      class="relative z-10 border-t border-amber-300/40 bg-amber-200 px-6 py-4 text-center text-2xl font-semibold text-amber-900"
    >
      {data.effective.notificationMessage}
    </div>
  {/if}

</main>
