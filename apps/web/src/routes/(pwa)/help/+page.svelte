<script lang="ts">
  import { enhance } from "$app/forms";
  import Screen from "$lib/components/Screen.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { getMeContext } from "$lib/state/getContexts";

  export let data;
  export let form;

  const me = getMeContext();
  const screenPhoto: any = undefined;
  $: values = ((form as any)?.values ?? {}) as Record<string, string>;
  let isSubmitting = false;
  let isSubmitted = false;
  let successMessage = "Support request sent. We'll follow up soon.";

  const handleEnhance = () => {
    isSubmitting = true;
    return async ({
      result,
      update,
    }: {
      result: any;
      update: () => Promise<void>;
    }) => {
      await update();
      isSubmitting = false;
      const resultData = (result as any)?.data;
      if (result.type === "success" && resultData?.success) {
        isSubmitted = true;
        successMessage = resultData.message || successMessage;
      }
    };
  };

  let deviceName = "";
  let devicePlatform = "";
  let deviceLanguage = "";
  let deviceViewport = "";
  let pageUrl = "";

  const ticketTypes = ["General Question", "Bug Report", "Other"];

  if (typeof window !== "undefined") {
    deviceName = navigator.userAgent;
    devicePlatform = navigator.platform;
    deviceLanguage = navigator.language;
    deviceViewport = `${window.innerWidth}x${window.innerHeight}`;
    pageUrl = window.location.href;
  }
</script>

<Screen title="Get Help" bigTitle="Get Help" photo={screenPhoto}>
  <div class="mx-auto max-w-3xl px-4 py-6">
    {#if !data.canGetHelp}
      <div
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
      >
        Support requests are not configured for this event yet.
      </div>
    {:else}
      <div class="mb-4 text-sm text-slate-600">
        Send us a message with any useful context so we can help as best as
        possible.
      </div>
      {#if isSubmitted || form?.success}
        <div
          class="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center"
        >
          <div class="text-3xl font-semibold text-emerald-800">
            Message Received!
          </div>
          <p class="mt-2 text-sm text-emerald-700/80">
            Our team is on it and will get back to you shortly.
          </p>
        </div>
      {:else}
        <form
          method="POST"
          use:enhance={handleEnhance}
          class="space-y-4 transition-all duration-200 {isSubmitting
            ? 'opacity-50'
            : 'opacity-100'}"
        >
          {#if form?.message}
            <div
              class={`rounded-lg border px-4 py-3 text-sm font-medium ${
                form?.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {form.message}
            </div>
          {/if}
          <div class="grid gap-1">
            <label class="text-sm font-medium text-slate-700" for="ticketType"
              >Issue</label
            >
            <select
              id="ticketType"
              name="ticketType"
              required
              class="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
              value={values.ticketType ?? "General Question"}
            >
              {#each ticketTypes as ticketType}
                <option value={ticketType}>{ticketType}</option>
              {/each}
            </select>
          </div>
          <div class="grid gap-1">
            <label class="text-sm font-medium text-slate-700" for="subject"
              >Subject</label
            >
            <input
              id="subject"
              name="subject"
              type="text"
              required
              minlength={3}
              value={values.subject ?? ""}
              placeholder="What's up?"
              class="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
            />
          </div>
          <div class="grid gap-1">
            <label class="text-sm font-medium text-slate-700" for="description"
              >Your Message</label
            >
            <textarea
              id="description"
              name="description"
              required
              minlength={10}
              rows={7}
              placeholder=""
              class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >{values.description ?? ""}</textarea
            >
          </div>

          <input type="hidden" name="deviceName" bind:value={deviceName} />
          <input
            type="hidden"
            name="devicePlatform"
            bind:value={devicePlatform}
          />
          <input
            type="hidden"
            name="deviceLanguage"
            bind:value={deviceLanguage}
          />
          <input
            type="hidden"
            name="deviceViewport"
            bind:value={deviceViewport}
          />
          <input type="hidden" name="pageUrl" bind:value={pageUrl} />

          <div
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            Signed in as: {$me?.email || "Unknown user"}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            class="w-full border border-b-2 border-a-accent/30 bg-a-accent/5 font-semibold text-a-accent brightness-90 hover:bg-a-accent/10"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      {/if}
    {/if}
  </div>
</Screen>
