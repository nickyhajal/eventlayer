<script lang="ts">
  import { goto } from '$app/navigation'
  import AdminScreen from '../../../AdminScreen.svelte'
  import UserAvatar from '$lib/components/UserAvatar.svelte'
  import { Button } from '$lib/components/ui/button'
  import { dayjs } from '@matterloop/util'
  import ChevronLeft from 'lucide-svelte/icons/chevron-left'

  export let data

  type ViewMode = 'user' | 'question'

  let mode: ViewMode = 'user'
  let selectedUserId = data.users[0]?.id ?? ''
  let selectedQuestionId = data.questions[0]?.id ?? ''

  $: if (!selectedUserId && data.users.length) {
    selectedUserId = data.users[0].id
  }

  $: if (!selectedQuestionId && data.questions.length) {
    selectedQuestionId = data.questions[0].id
  }

  $: selectedUser = data.users.find((user) => user.id === selectedUserId) ?? null
  $: selectedQuestion = data.questions.find((question) => question.id === selectedQuestionId) ?? null

  function getDisplayName(user: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  }) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown user'
  }

  function getQuestionLabel(question: {
    label?: string | null
    content?: string | null
  }) {
    return question.label?.trim() || question.content?.trim() || 'Untitled question'
  }

  function hasRichContent(item: { html?: string | null }) {
    return Boolean(item.html?.trim())
  }

  function getPlainContent(item: { value?: string | null; html?: string | null }) {
    return item.value?.trim() || item.html?.replace(/<[^>]+>/g, ' ')?.trim() || 'No response'
  }

  function goBackToForms(e: MouseEvent) {
    e.preventDefault()
    goto('/manage/forms', { replaceState: true })
  }
</script>

<AdminScreen title={true}>
  <div class="flex items-center justify-between gap-4" slot="title">
    <div class="flex items-center gap-2">
      <a
        href="/manage/forms"
        on:click={goBackToForms}
        class="flex items-center justify-center rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <div>
        <div class="text-2xl font-semibold">{data.form.name} Responses</div>
        <div class="mt-1 text-sm text-slate-500">
          {data.responseCount} respondent{data.responseCount === 1 ? '' : 's'}
        </div>
      </div>
    </div>
    <Button href={`/manage/forms/${data.form.id}`} variant="outline">Form Builder</Button>
  </div>

  <div class="grid min-h-[40rem] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[20rem_1fr]">
    <aside class="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
      <div class="border-b border-slate-200 p-4">
        <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            class={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'user' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            on:click={() => (mode = 'user')}
          >
            By User
          </button>
          <button
            class={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'question' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            on:click={() => (mode = 'question')}
          >
            By Question
          </button>
        </div>
      </div>

      {#if mode === 'user'}
        <div class="flex flex-col p-2">
          {#if data.users.length}
            {#each data.users as user}
              <button
                class={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  selectedUserId === user.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/80'
                }`}
                on:click={() => (selectedUserId = user.id)}
              >
                <div class="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    class="h-10 w-10"
                    fallbackClass="text-sm font-medium text-slate-400"
                    user={user}
                  />
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-slate-800">{getDisplayName(user)}</div>
                    <div class="truncate text-xs text-slate-500">{user.email || 'No email'}</div>
                  </div>
                </div>
                <div class="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {user.responses.length}
                </div>
              </button>
            {/each}
          {:else}
            <div class="px-3 py-6 text-sm text-slate-500">No responses yet.</div>
          {/if}
        </div>
      {:else}
        <div class="flex flex-col p-2">
          {#if data.questions.length}
            {#each data.questions as question}
              <button
                class={`rounded-xl px-3 py-2 text-left transition-colors ${
                  selectedQuestionId === question.id
                    ? 'bg-white shadow-sm ring-1 ring-slate-200'
                    : 'hover:bg-white/80'
                }`}
                on:click={() => (selectedQuestionId = question.id)}
              >
                <div class="line-clamp-2 text-sm font-medium text-slate-800">
                  {getQuestionLabel(question)}
                </div>
                <div class="mt-1 text-xs text-slate-500">
                  {question.answers.length} answer{question.answers.length === 1 ? '' : 's'}
                </div>
              </button>
            {/each}
          {:else}
            <div class="px-3 py-6 text-sm text-slate-500">This form has no answerable questions yet.</div>
          {/if}
        </div>
      {/if}
    </aside>

    <section class="min-w-0 bg-white">
      {#if mode === 'user'}
        {#if selectedUser}
          <div class="border-b border-slate-200 px-6 py-5">
            <div class="flex items-center gap-3">
              <UserAvatar
                class="h-12 w-12"
                fallbackClass="text-base font-medium text-slate-400"
                user={selectedUser}
              />
              <div>
                <div class="text-lg font-semibold text-slate-900">{getDisplayName(selectedUser)}</div>
                <div class="text-sm text-slate-500">{selectedUser.email || 'No email'}</div>
              </div>
            </div>
          </div>

          <div class="space-y-4 p-6">
            {#if selectedUser.responses.length}
              {#each selectedUser.responses as response}
                <div class="rounded-2xl border border-slate-200 p-4">
                  <div class="text-sm font-semibold text-slate-800">
                    {getQuestionLabel({
                      label: response.elementLabel,
                      content: response.elementContent,
                    })}
                  </div>
                  <div class="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    {#if hasRichContent(response)}
                      <div class="prose prose-sm max-w-none">{@html response.html}</div>
                    {:else}
                      <div class="whitespace-pre-wrap">{getPlainContent(response)}</div>
                    {/if}
                  </div>
                  <div class="mt-3 text-xs text-slate-400">
                    Updated {dayjs(response.updatedAt || response.createdAt).format('MMM D, YYYY h:mma')}
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-sm text-slate-500">This user has not submitted any responses.</div>
            {/if}
          </div>
        {:else}
          <div class="p-6 text-sm text-slate-500">No respondents yet.</div>
        {/if}
      {:else}
        {#if selectedQuestion}
          <div class="border-b border-slate-200 px-6 py-5">
            <div class="text-lg font-semibold text-slate-900">{getQuestionLabel(selectedQuestion)}</div>
            <div class="mt-1 text-sm text-slate-500">
              {selectedQuestion.answers.length} answer{selectedQuestion.answers.length === 1 ? '' : 's'}
            </div>
          </div>

          <div class="space-y-4 p-6">
            {#if selectedQuestion.answers.length}
              {#each selectedQuestion.answers as answer}
                <div class="rounded-2xl border border-slate-200 p-4">
                  <div class="flex items-center gap-3">
                    <UserAvatar
                      class="h-10 w-10"
                      fallbackClass="text-sm font-medium text-slate-400"
                      user={answer.user}
                    />
                    <div>
                      <div class="text-sm font-medium text-slate-800">{getDisplayName(answer.user)}</div>
                      <div class="text-xs text-slate-500">{answer.user.email || 'No email'}</div>
                    </div>
                  </div>
                  <div class="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    {#if hasRichContent(answer)}
                      <div class="prose prose-sm max-w-none">{@html answer.html}</div>
                    {:else}
                      <div class="whitespace-pre-wrap">{getPlainContent(answer)}</div>
                    {/if}
                  </div>
                  <div class="mt-3 text-xs text-slate-400">
                    Updated {dayjs(answer.updatedAt || answer.createdAt).format('MMM D, YYYY h:mma')}
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-sm text-slate-500">No answers for this question yet.</div>
            {/if}
          </div>
        {:else}
          <div class="p-6 text-sm text-slate-500">No answerable questions yet.</div>
        {/if}
      {/if}
    </section>
  </div>
</AdminScreen>
