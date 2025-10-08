<script lang="ts">
  import { page } from "$app/stores";
  import Screen from "$lib/components/Screen.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { getEventContext, getMeContext } from "$lib/state/getContexts";
  import BadgeCheck from "lucide-svelte/icons/badge-check";
  import HelpCircle from "lucide-svelte/icons/help-circle";
  import Mail from "lucide-svelte/icons/mail";
  import Map from "lucide-svelte/icons/map";
  import Users from "lucide-svelte/icons/users";
  import Utensils from "lucide-svelte/icons/utensils";

  const event = getEventContext();
  const tabs = $event.menus
    .filter((m) => m.location === "menu")
    .map((m) => {
      return { ...m, props: m.props ?? {} };
    });
  // const tabs = [
  // 	{
  // 		label: 'Panelists & Moderators',
  // 		icon: Users,
  // 		classes: 'col-span-2',
  // 		href: '/speakers',
  // 	},
  // 	{
  // 		label: 'Sponsors',
  // 		icon: BadgeCheck,
  // 		classes: 'col-span-2',
  // 		href: '/sponsors',
  // 	},
  // 	{
  // 		label: 'Venue Map',
  // 		icon: Map,
  // 		classes: '',
  // 		href: '/map',
  // 	},
  // 	{
  // 		label: 'Meal Options',
  // 		icon: Utensils,
  // 		classes: '',
  // 		href: '/meals',
  // 	},
  // 	{
  // 		label: 'FAQs',
  // 		icon: HelpCircle,
  // 		href: '/faq',
  // 	},
  // 	{
  // 		label: 'Contact',
  // 		icon: Mail,
  // 		href: '/contact',
  // 	},
  // ]

  $: bits = $page.url.pathname.split("/");
  const me = getMeContext();
</script>

<!-- class="flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b-2 border-slate-200/50 border-b-slate-300/50 bg-slate-100/70 py-9 text-left text-sm font-semibold text-slate-600 {bits[1] === currBits[1]?'' : ''} {classes ||''}" -->
<Screen title="Menu">
  <div class="mx-auto min-h-[calc(100vh-5rem)] max-w-7xl">
    <div class="flex flex-col justify-end gap-2 pt-2">
      <div class="login flex gap-2">
        {#if !$me?.id}
          <Button
            href="/login"
            variant="ghost"
            class="login border-a-accent/30 bg-a-accent/5 text-a-accent  w-full border border-b-2 font-semibold brightness-90"
            >Login to your account</Button
          >
        {:else}
          <Button
            href="/settings"
            variant="ghost"
            class="login bg-a-accent/5  text-a-accent w-full font-semibold brightness-90"
            >Your Profile</Button
          >
          <Button
            href="/logout"
            variant="ghost"
            class="login border-a-accent/30 bg-a-accent/5 text-a-accent  w-full border border-b-2 font-semibold brightness-90"
            >Logout</Button
          >
        {/if}
      </div>

      <div
        class="menu fixed grid w-[calc(100dvw-1.5rem)] grid-cols-2 gap-2 lg:relative lg:w-full"
      >
        {#each tabs as { label, icon, link, props: { classes } }, i}
          {@const currBits = link.split("/")}
          <Button
            href={link}
            variant="secondary"
            class="bg-a-accent border-a-accent hover:bg-a-accent border-b-main/10 text-a-accent flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b border-opacity-[0.07] bg-opacity-[0.02] py-9 text-left text-sm font-semibold hover:bg-opacity-[0.07] {classes} "
          >
            {#if icon}
              <div
                class="border-main/20 mb-0.5 rounded-full border bg-white/40 p-1.5 opacity-80"
              >
                <div class="icon {bits[1] === currBits[1] ? 'selected' : ''}">
                  {@html icon}
                </div>
                <!-- <svelte:component this={icon} class="text-main/70  h-[1rem] w-[1rem] flex-none" /> -->
              </div>
            {/if}
            <div class="brightness-90">{label}</div>
          </Button>
        {/each}
      </div>
    </div>
  </div>
</Screen>

<style lang="postcss">
  .login {
    position: relative;
    top: calc(0.5rem + env(safe-area-inset-top));
  }
  .menu {
    bottom: calc(4rem + env(safe-area-inset-bottom));
  }
  .container > .flex {
    height: calc(100vh - 8rem - env(safe-area-inset-bottom));
  }
  .icon :global(svg) {
    @apply text-a-accent/70 h-[1rem]  w-[1rem] flex-none brightness-90;
  }
</style>
