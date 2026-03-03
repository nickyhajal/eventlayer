<script lang="ts">
  import Screen from "$lib/components/Screen.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";

  import type { Media, User } from "@matterloop/db";
  import { tw } from "@matterloop/ui";
  import { getMediaUrl } from "@matterloop/util";

  let className = "";
  export let fallbackClass = "";
  export { className as class };
  export let user: User & { photo: Media };
  $: src = getMediaUrl(user.photo, "w-256,h-256,fo-face,z-0.8");

  function firstAlpha(s: string | null | undefined): string {
    return s?.match(/[a-zA-Z]/)?.[0] ?? "";
  }
</script>

{#key user.id}
  <Avatar.Root class={tw(`h-20 w-20 ${className}`)}>
    <Avatar.Image {src} alt="" class="object-cover" />
    <Avatar.Fallback
      class={tw(`text-2xl font-light text-slate-500 ${fallbackClass}`)}
      >{firstAlpha(user.firstName)}{firstAlpha(user.lastName)}</Avatar.Fallback
    >
  </Avatar.Root>
{/key}
