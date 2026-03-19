<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import Heart from "lucide-svelte/icons/heart";

  import Screen from "$lib/components/Screen.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { trpc } from "$lib/trpc/client";

  import { Markdown } from "@matterloop/ui";
  import { getMediaUrl } from "@matterloop/util";

  export let data;

  $: sponsor = data.sponsor;
  $: screenPhoto = sponsor.photo as any;
  let heartLoading = false;

  onMount(async () => {
    if (!data.autoHeart) return;

    if (data.isHearted) {
      await goto(`/sponsors/${sponsor.id}`, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
      return;
    }

    heartLoading = true;
    try {
      await trpc().sponsor.setHeart.mutate({
        sponsorId: sponsor.id,
        hearted: true,
        source: data.heartSource || "qr",
      });
      await goto(`/sponsors/${sponsor.id}`, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
    } finally {
      heartLoading = false;
    }
  });

  async function toggleHeart() {
    if (!data.me || heartLoading) return;

    heartLoading = true;
    try {
      await trpc().sponsor.setHeart.mutate({
        sponsorId: sponsor.id,
        hearted: !data.isHearted,
        source: "manual",
      });
      await invalidateAll();
    } finally {
      heartLoading = false;
    }
  }
</script>

<Screen title={sponsor.title || "Sponsor"} back="/sponsors" photo={screenPhoto}>
  <div class="mx-auto max-w-7xl py-6">
    <div
      class="flex pt-16 md:pt-0 flex-col items-center justify-start gap-2 pb-6"
    >
      {#if sponsor.photo}
        <div
          class="mb-16 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-8"
        >
          <img
            src={getMediaUrl(sponsor.photo, "w-780")}
            class="w-80"
            alt={`Photo of ${sponsor.title || "sponsor"}`}
          />
        </div>
      {/if}
      <div class="flex flex-grow flex-col items-start">
        <div
          class="w-fell flex-grow pb-0 text-left text-2xl font-bold xs:text-3xl"
        >
          {sponsor.title}
        </div>
      </div>
    </div>

    {#if data.me}
      <Button
        disabled={heartLoading}
        on:click={toggleHeart}
        class="relative mb-4 grid h-10 w-full grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg bg-slate-100 p-0 text-center text-sm text-slate-700 hover:bg-rose-50"
      >
        <div
          class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
        >
          <Heart
            class={`inline w-4 ${data.isHearted ? "fill-rose-500 text-rose-500" : "text-rose-600"}`}
          />
        </div>
        <div class="px-3 font-medium">
          {heartLoading
            ? "Saving..."
            : data.isHearted
              ? "Remove Heart"
              : "Heart Sponsor"}
        </div>
      </Button>
    {/if}

    {#if sponsor?.url}
      <Button
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        class="-mt-2 mb-4 h-9 w-full rounded-lg bg-sky-700 text-sm"
      >
        View Website
      </Button>
    {/if}

    {#if sponsor.users.length}
      <div class="mt-4 gap-1 rounded-lg bg-blue-50/50 p-2">
        <div class="text-sm font-semibold text-slate-500">Reps Attending</div>
        <div class="mt-1 flex flex-wrap gap-1">
          {#each sponsor.users as { id, user }}
            <a
              href={`/user/${id}`}
              class="flex w-fit items-center rounded-lg border border-b-2 border-slate-100 bg-white px-2 py-1 text-sm font-medium text-slate-700"
            >
              {#if user?.photo}
                <img
                  src={getMediaUrl(user.photo)}
                  class="flex-0 mr-1 h-6 w-6 rounded-full object-cover"
                  alt={`${user?.firstName} ${user?.lastName}`}
                />
              {/if}
              {user?.firstName}
              {user?.lastName}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    {#if sponsor?.description}
      <Markdown class="pr-4 pt-4 text-slate-600" data={sponsor?.description} />
    {/if}
  </div>
</Screen>
