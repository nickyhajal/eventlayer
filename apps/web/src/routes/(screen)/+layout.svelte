<script lang="ts">
  import "../../app.postcss";

  import { onMount, setContext } from "svelte";
  import { writable, type Writable } from "svelte/store";

  import { eventWritable } from "$lib/client/models/eventWritable";

  // import { initOpenReplay } from '$lib/openreplay'
  // import { initWorkers, NotificationWorker } from '$lib/ServiceWorkerController'
  export let data;
  let mounted = false;
  let notificationRequestOpen = false;
  let nprogTimo = 0;
  type MeType = typeof $page.data.me;
  let me: Writable<MeType> | undefined;
  let eventContextSet = false;
  const event = eventWritable(data.event);
  $: if (data.event) {
    if (!eventContextSet) {
      setContext("event", event);
      eventContextSet = true;
    } else {
      event.set(data.event);
    }
  }
</script>

<slot />
