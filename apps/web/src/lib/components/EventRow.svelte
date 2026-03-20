<script lang="ts">
  import ChevronRight from "lucide-svelte/icons/chevron-right";

  import type { Event } from "@matterloop/db";
  import { getMediaUrl } from "@matterloop/util";
  import UserAvatar from "./UserAvatar.svelte";

  export let event: Event;
  $: hosts = event.users.filter((user) => user.type === "host");
  $: firstHost = hosts.slice(0, 1);
  $: moreHosts = hosts.slice(1);
</script>

<a
  href="/schedule/{event.id}"
  class="relative z-0 mb-2 grid w-full grid-cols-[1fr_1.2rem] items-center justify-between gap-2 pb-2"
>
  {#if event.photo || event?.venue?.photo}
    <!-- <img
      src={getMediaUrl(event.photo || event?.venue?.photo, "w-180")}
      class="h-10 w-14 flex-none rounded-md bg-cover object-cover"
    /> -->
  {:else}
    <div class="h-12 w-20 flex-none rounded-md bg-slate-100"></div>
  {/if}
  <div class="flex flex-none flex-col -mt-[4px]">
    <div
      class="-mb-0.5 line-clamp-1 w-full text-[0.92rem] font-semibold text-slate-800"
    >
      {event.name}
    </div>
    {#if event.venue}
      <div
        class="flex items-center w-full line-clamp-1 text-[0.86rem] text-slate-600"
      >
        <span class="font-medium">{event.venue.name}</span>
        {#if hosts.length > 0}
          <div class="flex items-center gap-0.5">
            <div class="pl-1.5 pr-0.5 text-lg">·</div>
            {#each firstHost as host}
              <UserAvatar user={host.user} class="h-4 w-4" />
              {host.user.firstName}
              {host.user.lastName}
            {/each}
            {#if moreHosts.length > 0}
              <div
                class=" bg-slate-100 px-1 rounded-md ml-1 text-xs text-slate-600"
              >
                +{moreHosts.length}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  <ChevronRight class="h-5 w-5 mr-3 flex-none self-center text-slate-400" />
</a>
