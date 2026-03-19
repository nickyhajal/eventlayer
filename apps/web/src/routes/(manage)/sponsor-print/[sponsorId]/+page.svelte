<script lang="ts">
  import { getMediaUrl } from "@matterloop/util";

  export let data;
  $: qrSettings = (data.sponsor.settings || {}) as {
    qrEyebrow?: string;
    qrTitle?: string;
    qrDescription?: string;
  };
  $: eventLargeLogo =
    (data.event as any)?.largeLogo || (data.event as any)?.photo;
  $: sponsorPhoto = data.sponsor?.photo;

  $: qrEyebrow = qrSettings.qrEyebrow || "Neurodiversion Expo";
  $: qrTitle = qrSettings.qrTitle || data.sponsor.title || "Sponsor";
  $: qrDescription =
    qrSettings.qrDescription ||
    `Scan to connect with ${data.sponsor.title || "this sponsor"} and get follow-up information after the expo.`;
</script>

<svelte:head>
  <title>{data.sponsor.title || "Sponsor"} QR Code</title>
  <style>
    @page {
      size: auto;
      margin: 0;
    }

    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  </style>
</svelte:head>

<div class="min-h-screen bg-white text-slate-900">
  <div
    class="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-10 py-16 text-center"
  >
    {#if eventLargeLogo || sponsorPhoto}
      <div class="mb-8 flex w-full items-center justify-center gap-8">
        {#if eventLargeLogo}
          <div class="flex h-24 min-w-52 items-center justify-center">
            <img
              src={getMediaUrl(eventLargeLogo)}
              alt={data.event?.name || "Event logo"}
              class="max-h-24 w-auto object-contain"
            />
          </div>
        {/if}
        {#if sponsorPhoto}
          <div class="flex h-20 min-w-40 items-center justify-center">
            <img
              src={getMediaUrl(sponsorPhoto)}
              alt={data.sponsor.title || "Sponsor logo"}
              class="max-h-20 w-auto object-contain"
            />
          </div>
        {/if}
      </div>
    {/if}

    <div
      class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500"
    >
      {qrEyebrow}
    </div>
    <h1
      class="mt-4 text-balance text-5xl font-bold tracking-tight text-slate-950 print:text-6xl"
    >
      {qrTitle}
    </h1>
    <p class="mt-5 max-w-2xl text-xl leading-8 text-slate-600 print:text-2xl">
      {qrDescription}
    </p>

    <div
      class="mt-12 w-full max-w-[34rem] rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
    >
      <img
        src={data.qrcode}
        alt={`QR code for ${data.sponsor.title}`}
        class="mx-auto w-full"
      />
    </div>
  </div>
</div>
