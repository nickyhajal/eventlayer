<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import LinkIcon from "lucide-svelte/icons/link";
  import Loader from "lucide-svelte/icons/loader";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import FileText from "lucide-svelte/icons/file-text";
  import FileSpreadsheet from "lucide-svelte/icons/file-spreadsheet";
  import File from "lucide-svelte/icons/file";

  import type { Media } from "@matterloop/db";

  import Uploader from "$lib/components/ui/Uploader.svelte";
  import { trpc } from "$lib/trpc/client";
  import { getMediaUrl } from "$lib/util/getMediaUrl";
  import { toast } from "svelte-sonner";
  import AdminScreen from "../AdminScreen.svelte";

  export let data;

  type MediaCursor = { id: string; createdAt: string } | null;

  const parentType = "event";
  const parentId: string = data.event.id;

  let items: Media[] = [];
  let loading = false;
  let fetchingMore = false;
  let nextCursor: MediaCursor = null;
  let sentinel: HTMLDivElement;
  let observer: IntersectionObserver;
  let errorMsg = "";
  let captionDrafts: Record<string, string> = {};
  let captionSaving: Record<string, boolean> = {};
  let deleteState: Record<string, boolean> = {};
  let lightboxMedia: Media | null = null;
  const PAGE_SIZE = 24;
  const imageExt = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "tiff",
  ]);
  const docExt = new Set(["doc", "docx", "pdf", "txt", "rtf", "ppt", "pptx"]);
  const sheetExt = new Set(["xls", "xlsx", "csv"]);

  onMount(() => {
    loadPage(true);
    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && nextCursor && !fetchingMore && !loading) {
          loadPage();
        }
      },
      { rootMargin: "320px" },
    );
    if (sentinel) observer.observe(sentinel);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  $: if (observer && sentinel) {
    observer.disconnect();
    observer.observe(sentinel);
  }

  $: if (items?.length) {
    let mutated = false;
    const drafts = { ...captionDrafts };
    for (const media of items) {
      if (!(media.id in drafts)) {
        drafts[media.id] = media.title || "";
        mutated = true;
      }
    }
    if (mutated) captionDrafts = drafts;
  }

  async function loadPage(reset = false) {
    if (reset) {
      loading = true;
      items = [];
      nextCursor = null;
    } else {
      fetchingMore = true;
    }
    errorMsg = "";
    try {
      const payload = await trpc().media.list.query({
        parentType,
        limit: PAGE_SIZE,
        cursor: reset ? undefined : (nextCursor ?? undefined),
      });
      if (reset) items = [];
      items = [...items, ...payload.items];
      nextCursor = payload.nextCursor;
    } catch (err) {
      console.error(err);
      errorMsg = err?.message || "Unable to load media.";
    } finally {
      loading = false;
      fetchingMore = false;
    }
  }

  function isImage(media: Media) {
    const ext = (media.ext || "").toLowerCase();
    return imageExt.has(ext);
  }

  function iconFor(media: Media) {
    const ext = (media.ext || "").toLowerCase();
    if (sheetExt.has(ext)) return FileSpreadsheet;
    if (docExt.has(ext)) return FileText;
    return File;
  }

  function labelFor(media: Media) {
    return (media.ext || "").toUpperCase() || "FILE";
  }

  function fallbackCopyText(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error(err);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function copyLink(media: Media) {
    const url = getMediaUrl(media);
    const label = isImage(media) ? "Image" : "File";
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        fallbackCopyText(url);
      }
    } catch (err) {
      console.error(err);
      fallbackCopyText(url);
    } finally {
      toast.success(`${label} URL copied!`);
    }
  }

  async function saveCaption(media: Media) {
    const nextTitle = captionDrafts[media.id] ?? "";
    if (nextTitle === (media.title || "")) return;
    captionSaving = { ...captionSaving, [media.id]: true };
    try {
      await trpc().media.update.mutate({ id: media.id, title: nextTitle });
      media.title = nextTitle;
    } catch (err) {
      console.error(err);
    } finally {
      const { [media.id]: _, ...rest } = captionSaving;
      captionSaving = rest;
    }
  }

  async function deleteMedia(media: Media) {
    if (!confirm("Delete this file?")) return;
    deleteState = { ...deleteState, [media.id]: true };
    try {
      await trpc().media.delete.mutate({ id: media.id });
      items = items.filter((item) => item.id !== media.id);
      const { [media.id]: _, ...restDrafts } = captionDrafts;
      captionDrafts = restDrafts;
    } catch (err) {
      console.error(err);
    } finally {
      const { [media.id]: __, ...rest } = deleteState;
      deleteState = rest;
    }
  }

  function handleUploadSuccess() {
    loadPage(true);
  }

  function openLightbox(media: Media) {
    if (!isImage(media)) return;
    lightboxMedia = media;
  }

  function closeLightbox() {
    lightboxMedia = null;
  }

  function handleLightboxKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && lightboxMedia) {
      closeLightbox();
    }
  }
</script>

<svelte:window on:keydown={handleLightboxKeydown} />

<AdminScreen title="Media">
  <div class="flex flex-col gap-6">
    <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-lg font-semibold text-stone-700">Upload Files</h2>
      <Uploader
        {parentType}
        {parentId}
        allowMultipleUploads={true}
        onSuccess={handleUploadSuccess}
        defaultMessage="Drop files or browse to upload"
      />
      <p class="mt-3 text-sm text-stone-500">
        Accepts images and other files types (.doc, .xls, .pdf, etc.)
      </p>
    </div>

    <div>
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-xl font-semibold text-stone-700">Gallery</p>
        </div>
        <button
          class="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
          on:click={() => loadPage(true)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      {#if errorMsg}
        <div
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorMsg}
        </div>
      {/if}
      <div class="columns-1 gap-4 md:columns-2 xl:columns-3">
        {#each items as media (media.id)}
          <div
            class="mb-4 break-inside-avoid rounded-lg border border-stone-200 bg-white shadow-sm"
          >
            <div class="relative">
              {#if isImage(media)}
                <img
                  src={getMediaUrl(media)}
                  alt={media.title || media.id}
                  class="h-auto w-full cursor-zoom-in rounded-t-lg object-cover"
                  loading="lazy"
                  on:click={() => openLightbox(media)}
                />
              {:else}
                <div
                  class="flex h-48 flex-col items-center justify-center gap-2 rounded-t-lg bg-stone-50"
                >
                  <div class="rounded-full bg-white p-3 text-stone-500">
                    <svelte:component this={iconFor(media)} class="h-8 w-8" />
                  </div>
                  <div class="text-sm font-medium text-stone-600">
                    {labelFor(media)}
                  </div>
                  <div
                    class="w-full truncate px-4 text-center text-xs text-stone-500"
                  >
                    {media.path}/{media.id}
                  </div>
                </div>
              {/if}
              <div class="absolute right-2 top-2 flex gap-2">
                <button
                  class="rounded-full bg-white/90 p-1 text-stone-600 shadow hover:bg-white"
                  title="Copy link"
                  on:click={() => copyLink(media)}
                >
                  <LinkIcon class="h-4 w-4" />
                </button>
                <button
                  class="rounded-full bg-white/90 p-1 text-stone-600 shadow hover:bg-white"
                  title="Delete"
                  on:click={() => deleteMedia(media)}
                  disabled={deleteState[media.id]}
                >
                  {#if deleteState[media.id]}
                    <Loader class="h-4 w-4 animate-spin" />
                  {:else}
                    <Trash2 class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            </div>
            <div class="space-y-3 px-4 py-3 text-sm">
              <div class="flex justify-between text-xs text-stone-500">
                <span>{media.ext?.toUpperCase() || "FILE"}</span>
                <span
                  >{media.createdAt
                    ? new Date(media.createdAt).toLocaleString()
                    : ""}</span
                >
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-stone-500"
                  >Caption</label
                >
                <input
                  class="w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  bind:value={captionDrafts[media.id]}
                  placeholder="Add a caption"
                  on:blur={() => saveCaption(media)}
                />
                {#if captionSaving[media.id]}
                  <div
                    class="mt-1 flex items-center gap-1 text-xs text-emerald-600"
                  >
                    <Loader class="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-4 flex flex-col items-center gap-2 text-sm text-stone-500">
        {#if loading}
          <div class="flex items-center gap-2">
            <Loader class="h-4 w-4 animate-spin" /> Loading media…
          </div>
        {:else if fetchingMore}
          <div class="flex items-center gap-2">
            <Loader class="h-4 w-4 animate-spin" /> Fetching more…
          </div>
        {:else if !items.length}
          <div>No media yet.</div>
        {:else if !nextCursor}
          <div>-</div>
        {/if}
        <div bind:this={sentinel}></div>
      </div>
    </div>
  </div>
</AdminScreen>

{#if lightboxMedia}
  <div
    class="fixed inset-0 z-50 flex flex-col bg-black/90 p-6 text-white"
    role="dialog"
    aria-modal="true"
    aria-label="Media preview"
    on:click={closeLightbox}
  >
    <div class="mb-4 flex items-center justify-end">
      <button
        class="rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-sm font-medium uppercase tracking-wide hover:bg-white/20"
        on:click|stopPropagation={closeLightbox}
      >
        Close
      </button>
    </div>
    <div
      class="flex flex-1 items-center justify-center"
      on:click|stopPropagation
    >
      <img
        src={getMediaUrl(lightboxMedia)}
        alt={lightboxMedia.title || lightboxMedia.id}
        class="max-h-full w-auto max-w-full rounded-md object-contain"
      />
    </div>
    {#if lightboxMedia.title}
      <p class="mt-4 text-center text-sm text-stone-200">
        {lightboxMedia.title}
      </p>
    {/if}
  </div>
{/if}
