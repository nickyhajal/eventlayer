<script lang="ts">
  import Element from '$lib/components/form/Element.svelte'
  import type { SvelteComponent } from 'svelte'

  import { FormRow, tw } from '@matterloop/ui'

  interface Option {
    label: string
    value: string
  }
  interface FormElement {
    id?: string
    formId: string
    type: string
    content: string
    label: string
    placeholder: string
    ord: number
    page: number
    step: number
    group: number
    options: Option[]
    key?: string
  }
  export let elements: FormElement[]
  export let rowClass = ''
  export let values = {}
  export let shouldAutoFocus = true
  export let includedComponents: { [key: string]: SvelteComponent } = {}
  export let handleRowClick: false | ((e: FormElement) => void) = false
  export let selectedId: string | undefined
  export let showPageMarkers = false

  function getVisibleElements(elements) {
    return elements.filter(({ hide }) => !hide || !hide(values))
  }

  function getPageLabel(page: number) {
    return `Page ${page}`
  }
</script>

{#each elements as el, i}
  {#if showPageMarkers && i > 0 && (elements[i - 1]?.page ?? 0) !== (el.page ?? 0)}
    <div
      class="my-4 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400"
    >
      <div class="h-px flex-1 bg-slate-300/80"></div>
      <div>{getPageLabel(el.page ?? 0)}</div>
      <div class="h-px flex-1 bg-slate-300/80"></div>
    </div>
  {/if}
  <div
    class="{selectedId === el.id ? 'bg-yellow-50' : ''} {rowClass}"
    on:click={() => handleRowClick && handleRowClick(el)}
    role={handleRowClick ? 'button' : ''}
    tabindex={handleRowClick ? '-1' : ''}
  >
    {#if el.length}
      <div class={el[0].rowClass}>
        {#if el[0].rowLabel}
          <div
            class={tw(`ml-0.5 pb-1 text-sm font-medium text-slate-600`, el[0].rowLabelClass || '')}
          >
            {el[0].rowLabel}
          </div>
        {/if}
        <FormRow>
          {#each getVisibleElements(el) as props}
            <Element {props} bind:values {includedComponents} />
          {/each}
        </FormRow>
      </div>
    {:else}
      <Element
        props={{ ...el, autofocus: shouldAutoFocus && i === 0 }}
        bind:values
        {includedComponents}
      />
    {/if}
  </div>
{/each}
