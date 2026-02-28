<script lang="ts">
	import { trpcCaller } from '$lib/util/trpcCaller'
	import { Carta, CartaEditor } from 'carta-md'
	import { writable } from 'svelte/store'

	import AdminScreen from '../../AdminScreen.svelte'

	import 'carta-md/default.css' /* Default theme */
	import 'carta-md/light.css' /* Markdown input theme */

	import { PUBLIC_BASE_URL } from '$env/static/public'
	import { trpc } from '$lib/trpc/client'
	import { toast } from 'svelte-sonner'

	import type { Page } from '@matterloop/db'
	import { debounce } from '@matterloop/util'

	export let data
	let value = ''

	const carta = new Carta({
		// Remember to use a sanitizer to prevent XSS attacks!
		// More on that below
		// sanitizer: ...
	})
	let page = writable<Page>(data.page)
	let saving = false
	let lastSavedPage: string
	let lastPage = JSON.stringify($page)
	const { call, status, enhance } = trpcCaller(trpc().page.upsert.mutate)

	async function submitRaw() {
		if (lastSavedPage !== JSON.stringify($page)) {
			let shouldSubmit = false
			if (lastSavedPage) shouldSubmit = true
			lastSavedPage = JSON.stringify($page)
			if (!shouldSubmit || saving) return

			saving = true
			const res = await call({
				...$page,
			})
			saving = false
			toast.success('Page Saved')
			if (res) {
				if (res.createdAt) {
					page.set({ ...$page, id: res.id, createdAt: res.createdAt })
				}
			}
		}
	}
	const save = debounce(submitRaw, 900)
	$: if (lastPage !== JSON.stringify($page)) {
		lastPage = JSON.stringify($page)
	}
	$: (save(), $page)
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="flex flex-col">
			<input
				type="text"
				class="w-[45rem] rounded-t-xl border border-stone-200 bg-stone-50/20 px-4 py-3 text-2xl font-semibold !outline-none !ring-0 transition-all focus-visible:ring-transparent"
				bind:value={$page.title}
			/>
			<div
				class="flex w-[45rem] overflow-hidden rounded-b-xl border border-t-0 border-stone-200 bg-stone-50/50 text-sm font-normal text-stone-500 transition-all hover:bg-stone-100 focus-visible:ring-transparent"
			>
				<span class="bg-stone-200/60 px-3 py-[0.4rem] text-xs font-medium text-stone-400"
					>http://{PUBLIC_BASE_URL}/</span
				>
				<input
					type="text"
					class="flex-grow bg-white px-1 py-[0.24rem] text-stone-500 !outline-none !ring-0 transition-all hover:bg-blue-50"
					bind:value={$page.path}
				/>
			</div>
		</div>
	</div>

	<div class="w-[45rem]">
		<CartaEditor {carta} bind:value={$page.body} mode="tabs" theme="github" />
	</div>
	<div></div>
</AdminScreen>

<style lang="postcss" global>
	/* Set your custom monospace font */
	.carta-theme__github {
		--carta-bg: #eee;
		--carta-bg-light: #ddd;
		--carta-border: #ccc;
		--carta-accent: #eee;

		&.carta-editor {
			@apply min-h-[70vh] rounded-xl border border-stone-200 bg-stone-50/30;

			/* &:focus-within {
			outline: 2px solid var(--carta-accent);
		} */

			.carta-wrapper {
				padding: 1rem;
				flex-grow: 1;
				overflow-y: auto;

				.carta-container {
					min-height: 120px;
					max-height: 160px;
				}
			}

			.carta-font-code {
				font-family: 'Fira Code', monospace;
				@apply text-sm leading-loose text-stone-600 caret-blue-700;
			}

			.carta-toolbar {
				height: 2.5rem;
				@apply rounded-t-xl border-0  bg-stone-200/100;

				.carta-icon {
					width: 2rem;
					height: 2rem;

					&:hover {
						@apply text-stone-600;
						@apply bg-stone-200/100;
					}
				}
			}

			.carta-toolbar-left button,
			.carta-toolbar-right,
			.carta-filler {
				border-bottom: 1px solid var(--carta-border);
			}

			.carta-toolbar-left {
				& > *:first-child {
					border-top-left-radius: 0.5rem;
				}

				& > * {
					padding-left: 1rem;
					padding-right: 1rem;
					font-size: 0.95rem;
				}

				button {
					height: 100%;
				}

				.carta-active {
					background-color: var(--carta-bg);
					@apply text-stone-600;

					border-right: 1px solid var(--carta-border);
					border-bottom: 1px solid var(--carta-bg);

					&:not(:first-child) {
						border-left: 1px solid var(--carta-border);
					}
				}
			}

			.carta-toolbar-right {
				padding-right: 12px;
			}

			.carta-icons-menu {
				padding: 8px;
				border: 1px solid var(--carta-border);
				border-radius: 6px;
				min-width: 180px;
				background: var(--carta-bg);

				.carta-icon-full {
					padding-left: 6px;
					padding-right: 6px;

					margin-top: 2px;
					&:first-child {
						margin-top: 0;
					}

					&:hover {
						@apply text-stone-600;
						background-color: var(--carta-border);
					}

					span {
						margin-left: 6px;
						@apply text-stone-600;
						font-size: 0.85rem;
					}
				}
			}

			[class*='shj-lang-'] {
				background: transparent;
			}
		}

		&.carta-emoji {
			width: 18rem;
			max-height: 14rem;
			overflow-y: scroll;
			border-radius: 4px;
			font-family: inherit;
			background-color: var(--carta-bg);
			padding: 6px;
			scroll-padding: 6px;
			gap: 6px;
		}

		&.carta-emoji button {
			background: var(--carta-bg-light);

			aspect-ratio: 1;
			border-radius: 4px;
			border: 0;
			padding: 0;

			cursor: pointer;

			font-size: 1.2rem;
			line-height: 100%;
		}

		&.carta-emoji button:hover,
		&.carta-emoji button.carta-active {
			background: var(--carta-border);
		}

		&.carta-slash {
			width: 18rem;
			max-height: 14rem;
			overflow-y: scroll;
			border-radius: 4px;
			font-family: inherit;
			background-color: var(--carta-bg);
			padding: 6px;
			scroll-padding: 6px;
		}

		&.carta-slash span {
			width: fit-content;
		}

		&.carta-slash button {
			background: none;
			width: 100%;
			padding: 10px;
			border: 0;
			border-radius: 4px;
		}

		&.carta-slash .carta-slash-group {
			padding: 0 4px 0 4px;
			margin-bottom: 4px;
			font-size: 0.8rem;
		}

		&.carta-slash button.carta-active,
		&.carta-slash button:hover {
			background: var(--carta-bg-light);
			cursor: pointer;
		}

		&.carta-slash .carta-snippet-title {
			font-size: 0.85rem;
			font-weight: 600;
		}

		&.carta-slash .carta-snippet-description {
			font-size: 0.8rem;
			text-overflow: ellipsis;
		}
	}
</style>
