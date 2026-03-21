<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import Ably from "ably";

  import { Animate } from "@matterloop/ui";
  import { dayjs, getMediaUrl } from "@matterloop/util";

  import { wrapScreenBackdropCssForHead } from "$lib/screen/wrapScreenBackdropCssForHead";
  import { getEventContext } from "$lib/state/getContexts";

  export let data;
  const event = getEventContext();
  const upcomingPageRotationMs = 12000;
  const upcomingRefreshMs = 60000;
  let currentUpcomingPageIndex = 0;
  let currentUpcomingPageProgress = 0;
  let upcomingPageStartedAt = 0;
  $: showBanner =
    data.effective.notificationEnabled && data.effective.notificationMessage;
  $: isTopBanner = data.effective.notificationPosition !== "bottom";

  $: imageBackdropHeadHtml = wrapScreenBackdropCssForHead(
    data.imageModeBackdropCss,
  );
  $: mainLogoUrl = getMainLogoUrl();
  $: showLogoOnlyWhenNoUpcoming =
    data.effective.mode === "upcoming_events" &&
    !data.upcoming?.length &&
    !!mainLogoUrl;

  function getCardImage(event: any) {
    const media = event?.photo ?? event?.venue?.photo;
    return media ? getMediaUrl(media) : "";
  }

  function getMainLogoUrl() {
    const largeLogo = ($event as any)?.darkLogo;
    return largeLogo ? getMediaUrl(largeLogo, "w-512") : "";
  }

  function splitUpcomingIntoPages(events: any[]) {
    if (events.length <= 6) {
      return [events];
    }

    const firstPageSize = Math.ceil(events.length / 2);
    return [events.slice(0, firstPageSize), events.slice(firstPageSize)];
  }

  $: upcomingPages = splitUpcomingIntoPages(data.upcoming || []);
  $: activeUpcomingPage = upcomingPages[currentUpcomingPageIndex] || [];
  $: if (currentUpcomingPageIndex >= upcomingPages.length) {
    currentUpcomingPageIndex = 0;
  }
  $: if (upcomingPages.length <= 1) {
    currentUpcomingPageProgress = 0;
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
    const refreshInterval = window.setInterval(dataListener, upcomingRefreshMs);
    channel.subscribe("screens-updated", dataListener);
    channel.subscribe("screen-hard-refresh", hardRefreshListener);
    return () => {
      window.clearInterval(refreshInterval);
      channel.unsubscribe("screens-updated", dataListener);
      channel.unsubscribe("screen-hard-refresh", hardRefreshListener);
      client.close();
    };
  });

  onMount(() => {
    upcomingPageStartedAt = Date.now();
    const interval = window.setInterval(() => {
      if (upcomingPages.length <= 1) {
        currentUpcomingPageProgress = 0;
        upcomingPageStartedAt = Date.now();
        return;
      }

      const now = Date.now();
      const elapsed = now - upcomingPageStartedAt;

      if (elapsed >= upcomingPageRotationMs) {
        currentUpcomingPageIndex =
          (currentUpcomingPageIndex + 1) % upcomingPages.length;
        upcomingPageStartedAt = now;
        currentUpcomingPageProgress = 0;
        return;
      }

      currentUpcomingPageProgress = elapsed / upcomingPageRotationMs;
    }, 100);

    return () => {
      window.clearInterval(interval);
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
  class="relative isolate flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100"
>
  <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <div class="absolute inset-0"></div>
    {#if data.imageModeBackdropClassNames}
      <div
        class="absolute inset-0 opacity-60 {data.imageModeBackdropClassNames}"
      ></div>
    {/if}
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.34))]"
    ></div>
  </div>

  {#if !showLogoOnlyWhenNoUpcoming && showBanner && isTopBanner}
    <div
      class="relative z-10 border-b border-amber-200/40 bg-amber-200 px-6 py-4 text-center text-2xl font-semibold text-slate-900"
    >
      {data.effective.notificationMessage}
    </div>
  {:else if !showLogoOnlyWhenNoUpcoming}
    <div class="relative z-10 pt-8 text-5xl font-semibold tracking-tight">
      {#if mainLogoUrl}
        <img alt="" src={mainLogoUrl} class="mt-4 -mb-4 mx-auto w-24" />
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
  {:else if showLogoOnlyWhenNoUpcoming}
    <div
      class="relative z-10 flex min-h-screen flex-1 items-center justify-center px-10 py-10"
    >
      <img
        alt={data.event.name}
        src={mainLogoUrl}
        class="w-80 object-contain"
      />
    </div>
  {:else}
    <div class="relative z-10 px-8 py-8">
      <div class="mb-8 justify-center flex items-center gap-10 text-center">
        <div class="mt-2 text-slate-100 font-semibold text-5xl">
          {data.hasHappeningNowEvents
            ? "What's Happening Now"
            : "What's Coming Up"}
        </div>
      </div>

      {#if data.upcoming?.length}
        <div class="mx-auto">
          <Animate class="mx-auto">
            {#key currentUpcomingPageIndex}
              <div transition:fade={{ duration: 450 }}>
                <div class="mx-auto flex flex-wrap justify-center gap-6">
                  {#each activeUpcomingPage as event}
                    <div
                      class="overflow-hidden rounded-2xl flex-none {activeUpcomingPage.length >
                      4
                        ? 'w-[30%]'
                        : 'w-[30%]'} border border-slate-700 bg-slate-900 shadow-xl"
                    >
                      {#if getCardImage(event)}
                        <img
                          alt={event.name}
                          src={getCardImage(event)}
                          class="h-[13rem] w-full object-cover"
                        />
                      {/if}
                      <div class="space-y-2 p-5">
                        <div
                          class="text-3xl font-semibold line-clamp-2 leading-tight"
                        >
                          {event.name}
                        </div>
                        <div class="text-2xl text-slate-200">
                          {dayjs(event.startsAt).format("h:mma")} at {event
                            .venue?.name || "TBA"}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/key}
          </Animate>

          {#if upcomingPages.length > 1}
            <div class="mt-8 flex items-center justify-center gap-3">
              {#each upcomingPages as _, pageIndex}
                {#if pageIndex === currentUpcomingPageIndex}
                  <div
                    class="relative h-3 w-16 overflow-hidden rounded-full bg-white/20"
                  >
                    <div
                      class="absolute inset-y-0 left-0 rounded-full bg-white transition-[width]"
                      style={`width: ${Math.max(
                        0,
                        Math.min(100, currentUpcomingPageProgress * 100),
                      )}%`}
                    ></div>
                  </div>
                {:else}
                  <div
                    class="h-3 w-3 rounded-full bg-white/40 opacity-70"
                  ></div>
                {/if}
              {/each}
            </div>
          {/if}
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

  {#if !showLogoOnlyWhenNoUpcoming && showBanner && !isTopBanner}
    <div
      class="relative z-10 border-t border-amber-300/40 bg-amber-200 px-6 py-4 text-center text-2xl font-semibold text-amber-900"
    >
      {data.effective.notificationMessage}
    </div>
  {/if}
</main>
