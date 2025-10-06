<script lang="ts">
  import { goto } from "$app/navigation";
  import FormElements from "$lib/components/form/FormElements.svelte";
  import NdBase from "$lib/components/NDBase.svelte";
  import Screen from "$lib/components/Screen.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { NextButton } from "$lib/components/ui/calendar/index.js";
  import { trpc } from "$lib/trpc/client.js";
  import { onMount } from "svelte";

  import { groupBy } from "@matterloop/util";

  export let data;
  let scrollElm: HTMLElement;
  $: sessionId = data.session?.id;
  let pageHeight = "auto";
  let values: Record<string, string> = data.form?.elements.reduce(
    (out, curr) => {
      out[curr.id] =
        data.session?.responses?.find(({ elementId }) => elementId === curr.id)
          ?.value || "";
      return out;
    },
    {} as Record<string, string>,
  );
  let onPage = -1;
  let lastPage = -1;
  const elementsByPage = groupBy(data.form?.elements, "page");
  const elementsListedByPage = Object.values(elementsByPage);
  let lastValues = { ...values };
  onMount(() => {
    next();
  });
  async function submit(e: Event | null) {
    if (e?.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (data.me.id) {
      let responses = Object.entries(values).flatMap(([id, value]) =>
        value && value !== lastValues[id] ? [{ id, value }] : [],
      );
      if (responses.length) {
        const res = await trpc().formSession.submit.mutate({
          formId: data.form?.id,
          sessionId,
          responses,
        });
        if (res?.[0]?.sessionId) {
          sessionId = res[0].sessionId;
        }
      }
      lastValues = { ...values };
    }
  }
  async function next(e = null) {
    // counting as done once they reach avatar, if they bail there, still counts as done
    if (onPage === elementsListedByPage.length - 2) {
      await trpc().user.upsert.mutate({
        id: data.me.id,
        userId: data.me.id,
        onboardStatus: "done",
      });
    }
    onPage += 1;
    scrollToCurrent();
    if (onPage > 0) {
      await submit(e);
    }
  }
  function prev() {
    if (onPage > 0) {
      onPage -= 1;
      scrollToCurrent();
    }
  }
  function scrollToCurrent() {
    const page = document.getElementById(`page-${onPage}`);
    scrollElm.scrollTo({
      top: page?.offsetTop,
      behavior: "smooth",
    });
  }
  let pageElms: HTMLElement[] = [];
  $: {
    if (lastPage !== onPage) {
      lastPage = onPage;
      setTimeout(() => {
        const newHeight = `${pageElms[onPage].clientHeight + 64}px`;
        pageHeight = newHeight;
      }, 100);
    }
  }
</script>

<form on:submit={(e) => submit(e)} class="pt-safe-offset-8 lg:pt-">
  <!-- <div
    class="wrap mx-auto font-bold py-2.5 text-center fixed top-0 bg-white/60 backdrop-blur-md z-10 border-b-2 border-slate-200/50 text-sm uppercase text-slate-600 tracking-wide w-full"
  >
    Create Your Account
  </div> -->
  <!-- <NdBase /> -->
  <div
    class="relative mx-auto -mt-5 max-w-lg overflow-hidden px-2 lg:h-[80vh] z-20"
    bind:this={scrollElm}
    style="height: {pageHeight}"
  >
    {#each Object.values(elementsByPage) as page, i}
      <!-- <div id="page-{i}" class="h-16 w-full"></div> -->
      <div
        id="page-{i}"
        bind:this={pageElms[i]}
        class="relative top-[5vh] mt-0 flex h-fit flex-col justify-start gap-3 transition-all duration-300 lg:top-[5vh] {onPage ===
        i
          ? 'opacity-100'
          : 'opacity-0'}"
      >
        <FormElements elements={page} bind:values shouldAutoFocus={i === 0} />
        <div class="mt-8 flex w-full items-center justify-between">
          <div class=" w-fit">
            {#if i > 0}
              <Button
                class="text-slate-600/70 rounded-full"
                variant="ghost"
                type="button"
                on:click={() => prev()}>Back</Button
              >
            {/if}
          </div>
          <!-- class="border-a-accent/10 border-b-a-accent/10 bg-a-accent/5 text-a-accent hover:bg-a-accent/10 w-52 border border-b-2 py-5  font-semibold shadow-none brightness-90" -->
          <Button
            class="rounded-full bg-[#060C3A] text-white px-12 py-4 h-14 text-base tracking-wide"
            type="button"
            on:click={next}
            >{i === elementsListedByPage.length - 1
              ? "Done"
              : "Continue"}</Button
          >
        </div>
      </div>
    {/each}
  </div>
</form>
