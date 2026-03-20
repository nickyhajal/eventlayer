<script lang="ts">
  import { browser } from "$app/environment";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import ChicletButton from "$lib/components/ui/ChicletButton.svelte";
  import { getEventContext } from "$lib/state/getContexts";
  import ShareIcon from "$lib/svg/ShareIcon.svelte";
  import { getRawRgb } from "$lib/util/getRawRgb";
  import Download from "lucide-svelte/icons/download";
  import EllipsisVertical from "lucide-svelte/icons/more-vertical";
  import X from "lucide-svelte/icons/x";
  import type { PWAInstallElement } from "@khmyznikov/pwa-install";
  import { tick } from "svelte";

  import { dayjs } from "@matterloop/util";

  import TabBar from "./TabBar.svelte";

  const event = getEventContext();
  /** Must stay mounted so `beforeinstallprompt` is captured; open with showDialog() */
  let pwaInstallEl: PWAInstallElement | undefined;
  let isPwa =
    typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false;
  let suggestedInstall =
    typeof window !== "undefined" &&
    window.localStorage.getItem("pwa-install-blocked") !== "true" &&
    !window.matchMedia("(display-mode: standalone)").matches;
  $: cssVars = $event?.colors
    ? Object.entries($event?.colors)
        .map(([key, value]) => {
          return `--a-${key}: ${getRawRgb(value)};`;
        })
        .join(" ")
    : "";
  $: showSidebar =
    !$page.url.pathname.includes("/login") &&
    !$page.url.pathname.includes("/welcome");

  function denyInstall() {
    window.localStorage.setItem("pwa-install-blocked", "true");
    suggestedInstall = false;
  }

  async function openPwaInstall() {
    await import("@khmyznikov/pwa-install");
    await tick();
    pwaInstallEl?.showDialog(true);
  }

  let lastRefresh = dayjs();
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      const state = document.visibilityState;
      if (state === "hidden") {
        // your PWA is now in the background
      }

      if (state === "visible") {
        if (dayjs().diff(lastRefresh, "m") > 1) {
          invalidateAll();
          lastRefresh = dayjs();
        }
      }
    });
  }
</script>

<div
  class="grid min-h-full w-screen overflow-x-hidden {showSidebar
    ? 'bg-slate-800 lg:grid-cols-[15rem_1fr]'
    : 'lg:grid-cols-[1fr]'} lg:bg-white"
  style={cssVars}
>
  <div class={showSidebar ? "lg:order-1" : ""}>
    <slot />
  </div>
  {#if showSidebar}
    <div
      class="tabbar lg:order-0 fixed bottom-0 z-50 w-full bg-slate-800 lg:relative lg:px-2 lg:py-3"
    >
      {#if suggestedInstall}
        <div
          class="flex w-full items-center border-t-4 border-yellow-900/5 bg-white lg:hidden"
        >
          <div
            class="flex w-full items-center justify-between border-t border-yellow-800/10 bg-yellow-50/60 pb-1.5 pl-6 pr-2 pt-1.5 text-sm font-semibold tracking-[0.3px] text-slate-900/70"
          >
            <div>Install on Your Home Screen</div>
            <div class="flex items-center gap-8">
              <ChicletButton
                class="flex gap-1.5 pl-[9px]"
                on:click={openPwaInstall}
              >
                <Download class="-mt-[1px] w-4 text-orange-800/40" />
                <span class="text-orange-700">Install</span>
              </ChicletButton>
              <button class="relative z-10 p-2" on:click={() => denyInstall()}>
                <X class="w-4 text-slate-900/70" />
              </button>
            </div>
          </div>
        </div>
      {/if}
      <div id="tabbar">
        <TabBar />
      </div>
    </div>
  {:else}
    <div></div>
  {/if}
</div>
{#if browser}
  {#await import("@khmyznikov/pwa-install") then}
    <pwa-install
      bind:this={pwaInstallEl}
      manual-apple
      manual-chrome
      manifest-url="/manifest.json"
    />
  {/await}
{/if}

<style>
  :global(body) {
    overflow-x: hidden;
  }
</style>
