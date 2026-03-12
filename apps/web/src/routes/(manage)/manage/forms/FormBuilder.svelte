<script lang="ts">
  import { Plus } from "@steeze-ui/heroicons";
  import ElementFormRow from "$lib/components/form/ElementFormRow.svelte";
  import FormElements from "$lib/components/form/FormElements.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { trpc } from "$lib/trpc/client";
  import { dragHandle, dragHandleZone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { writable } from "svelte/store";

  import type { FormElement, FormWithElements } from "@matterloop/db";
  import { HeroIcon } from "@matterloop/ui";
  import { getId, keyBy } from "@matterloop/util";

  const PAGE_MARKER_TYPE = "__page_marker__";

  type PageMarkerItem = {
    id: string;
    type: typeof PAGE_MARKER_TYPE;
    page: number;
  };

  type SidebarItem = FormElement | PageMarkerItem;

  let formInput: FormWithElements;
  export { formInput as form };

  let form = writable<FormWithElements>(formInput);
  let sidebarItems: SidebarItem[] = [];
  let isDragging = false;
  let selectedElement = $form?.elements?.[0] || null;
  let lastElement = "";
  $: selectedIndex = $form.elements?.findIndex(
    (el) => el.id === selectedElement?.id,
  );
  $: {
    if (selectedElement && lastElement !== JSON.stringify(selectedElement)) {
      const index = $form.elements.findIndex(
        (el) => el.id === selectedElement?.id,
      );
      $form.elements[index] = selectedElement;
      lastElement = JSON.stringify(selectedElement);
    }
  }
  function addElement(index?: number) {
    if (!$form.elements) $form.elements = [];
    if (index === undefined) {
      index = $form.elements.length;
    }
    const page =
      $form.elements[index]?.page ??
      $form.elements[index - 1]?.page ??
      selectedElement?.page ??
      0;
    $form.elements.splice(index, 0, {
      id: getId(),
      type: "text",
      label: "New Element Label",
      formId: $form.id,
      page,
    });
    selectedElement = $form.elements[index];
    $form.elements = $form.elements;
  }
  async function removeElement(index: number) {
    if (!$form.elements) return;

    const element = $form.elements[index];
    if (!element?.id) return;

    selectedElement = $form.elements[index - 1];
    $form.elements.splice(index, 1);
    $form.elements = $form.elements;
    await trpc().formElement.delete.mutate({ id: element.id });
    handleChangedElements();
  }
  function isPageMarker(item: SidebarItem): item is PageMarkerItem {
    return item.type === PAGE_MARKER_TYPE;
  }
  function buildSidebarItems(elements: FormElement[] = []): SidebarItem[] {
    return elements.flatMap((element, index) => {
      const currentPage = element.page ?? 0;
      const previousPage = elements[index - 1]?.page ?? 0;
      const items: SidebarItem[] = [];
      if (index > 0 && currentPage !== previousPage) {
        items.push({
          id: `page-marker-${element.id}-${currentPage}`,
          type: PAGE_MARKER_TYPE,
          page: currentPage,
        });
      }
      items.push(element);
      return items;
    });
  }
  function getPageLabel(page: number) {
    return `Page ${page}`;
  }
  function setFormElements(elements: FormElement[] = []) {
    $form.elements = elements;
    selectedElement =
      elements.find(({ id }) => id === selectedElement?.id) ||
      elements[0] ||
      null;
  }
  function getElementsFromSidebarItems(items: SidebarItem[]): FormElement[] {
    const elements: FormElement[] = [];
    let currentPage = 0;
    let hasCurrentPage = false;

    for (const item of items) {
      if (isPageMarker(item)) {
        currentPage = item.page ?? currentPage;
        hasCurrentPage = true;
        continue;
      }

      if (!hasCurrentPage) {
        currentPage = item.page ?? 0;
        hasCurrentPage = true;
      }

      elements.push({
        ...item,
        page: currentPage,
      });
    }

    return elements;
  }
  function handleChangedElements(
    nextElements: FormElement[] = $form.elements || [],
    previousElements: FormElement[] = $form.elements || [],
  ) {
    const previousById = keyBy(previousElements, "id");
    const orderChanges: { id: string; ord: number; page: number }[] = [];

    nextElements.map((elm, i) => {
      const previous = previousById[elm.id];
      const nextPage = elm.page ?? 0;
      if (previous?.ord !== i || (previous?.page ?? 0) !== nextPage) {
        orderChanges.push({ id: elm.id, ord: i, page: nextPage });
      }
      nextElements[i].ord = i;
      nextElements[i].page = nextPage;
    });

    setFormElements(nextElements);

    if (orderChanges.length && $form?.id) {
      trpc().formElement.order.mutate({ id: $form.id, changes: orderChanges });
    }
  }
  const flipDurationMs = 300;
  function handleDndConsider(e) {
    isDragging = true;
    sidebarItems = e.detail.items;
  }
  function handleDndFinalize(e) {
    const previousElements = [...($form.elements || [])];
    isDragging = false;
    sidebarItems = e.detail.items;
    handleChangedElements(
      getElementsFromSidebarItems(e.detail.items),
      previousElements,
    );
  }
  $: if (!isDragging) {
    sidebarItems = buildSidebarItems($form.elements || []);
  }
</script>

<div class="grid h-full w-full grid-rows-[5rem_1fr]">
  <div class="flex items-center border-b border-stone-100">
    <Input
      name="name"
      placeholder="Name"
      bind:value={$form.name}
      class="ml-4 border-0 p-0 pl-2 text-xl font-semibold text-slate-800 shadow-none transition-all focus-within:ring-slate-300  hover:bg-blue-50/40 hover:ring-slate-300 focus:ring-slate-300 focus-visible:ring-slate-300 active:ring-slate-300"
    />
  </div>
  <div class="grid h-full grid-cols-[18rem_1fr_18rem]">
    <div
      class="flex h-full flex-col gap-1 bg-stone-50/80 px-2 pb-2 pt-2"
      use:dragHandleZone={{
        items: sidebarItems,
        flipDurationMs,
        dropTargetStyle: {},
        dropTargetClasses: ["outline-blue-200", "outline-dashed", "outline-2"],
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#if sidebarItems.length}
        {#each sidebarItems as item, i (item.id)}
          <div class="w-full" animate:flip={{ duration: flipDurationMs }}>
            {#if isPageMarker(item)}
              <div class="py-2">
                <div
                  class="flex items-center gap-2 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  <div class="h-px flex-1 bg-slate-300/80"></div>
                  <div>{getPageLabel(item.page)}</div>
                  <div class="h-px flex-1 bg-slate-300/80"></div>
                </div>
              </div>
            {:else}
              <button
                use:dragHandle
                aria-label={item.content ||
                  item.label ||
                  `Form element ${i + 1}`}
                on:click={() => (selectedElement = item)}
                class="mb-1 flex w-full flex-col rounded-lg px-2 pb-2 pr-8 pt-1 text-left text-[0.85rem] font-medium text-stone-600 {selectedElement?.id ===
                item.id
                  ? 'bg-stone-200/50'
                  : 'bg-stone-200/20 hover:bg-stone-200/40'}"
              >
                <div class="mt-[1px] line-clamp-2">
                  {item.content || item.label}
                </div>
                <div
                  class="h-fit w-fit rounded-md bg-stone-200/70 px-1 py-[1px] text-[0.8rem] text-stone-700/70"
                >
                  {item.type}
                </div>
              </button>
              <!-- <div class="h-0.5 w-full border-b border-slate-400/20"></div> -->
            {/if}
          </div>
        {/each}
      {/if}
      {#if !$form.elements.length}
        <div class="rounded-xl px-2 pb-2 pt-8 text-center">
          <div class="mb-8 text-sm font-medium text-slate-500">
            Start Designing Your Report
          </div>
          <button
            on:click={() => addElement()}
            class="mt-3 block w-full rounded-lg border border-stone-100 bg-white px-2.5 py-2 text-[0.9rem] font-medium text-emerald-600/90 transition-all hover:border-emerald-500/20"
          >
            Add First Element
          </button>
        </div>
      {:else}
        <button
          on:click={() => addElement()}
          class="mt-3 block w-full rounded-lg border border-stone-100 bg-white px-2.5 py-3 text-[0.9rem] font-medium text-emerald-600/90 transition-all hover:border-emerald-500/20"
        >
          Add an Element
        </button>
      {/if}
    </div>
    <div class="flex flex-col gap-4 px-1 py-4">
      {#if $form.elements.length}
        <div class="mx-auto w-full max-w-xl">
          <FormElements
            elements={$form.elements}
            selectedId={selectedElement?.id}
            showPageMarkers={true}
            rowClass="rounded-lg px-6 py-3 w-full"
            handleRowClick={(el) => (selectedElement = el)}
          />
        </div>
      {/if}
    </div>
    {#if $form.elements.length && selectedElement}
      {#key selectedElement.id}
        <div class="flex h-full flex-col gap-1 bg-stone-50/80 px-2 pb-2 pt-2">
          <div class="relative flex-grow">
            <div class="sticky top-4 w-full">
              <ElementFormRow
                bind:element={selectedElement}
                index={selectedIndex}
                on:removeElement={() => removeElement(selectedIndex)}
                on:elementChange={() => handleChangedElements()}
              />
            </div>
          </div>
          <div class="flex items-end justify-start">
            <button
              on:click={() => addElement(selectedIndex + 1)}
              class="block w-fit rounded-md bg-slate-50 text-[0.85rem] font-medium text-slate-400/80 opacity-100 transition-all hover:bg-slate-200/80 hover:text-emerald-600/70 group-hover:opacity-100"
              ><HeroIcon src={Plus} class="w-5 text-slate-400" /></button
            >
          </div>
        </div>
      {/key}
    {/if}
  </div>
</div>
