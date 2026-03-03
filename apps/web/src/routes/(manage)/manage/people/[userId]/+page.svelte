<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import ChicletButton from "$lib/components/ui/ChicletButton.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { Textarea } from "$lib/components/ui/textarea";
  import { trpc } from "$lib/trpc/client";

  import AdminScreen from "../../AdminScreen.svelte";
  import UserForm from "../UserForm.svelte";

  export let data;
  let confirmingSend = false;
  let fullName = "";
  let userKey = "";
  let lastUserKey = "";
  $: userKey = `${data?.user?.id ?? ""}:${data?.user?.userId ?? ""}`;
  $: fullName = `${data?.user?.firstName ?? ""} ${data?.user?.lastName ?? ""}`.trim();
  $: onboardStatus = data.user.onboardStatus;
  $: if (userKey !== lastUserKey) {
    lastUserKey = userKey;
    confirmingSend = false;
  }
  async function sendWelcomeEmail() {
    if (!confirmingSend) {
      confirmingSend = true;
      setTimeout(() => {
        confirmingSend = false;
      }, 700);
    } else if (confirmingSend) {
      await trpc().user.sendWelcomeEmail.mutate({ userId: data.user.userId });
      invalidateAll();
    }
  }
  async function getLinkedInData() {
    const res = await trpc().user.syncLinkedInData.mutate({
      userId: data.user.userId,
    });
    console.log("res", res);
    invalidateAll();
  }

  function selectLoginLink(e: MouseEvent) {
    (e.currentTarget as HTMLInputElement | null)?.select();
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
  }
</script>

{#key userKey}
  <AdminScreen title={fullName}>
    <div slot="title">
      <div class="f flexitems-end gap-1">
        <ChicletButton on:click={() => sendWelcomeEmail()}>
          <span class="pl-1 pr-2 text-xs">👋</span>
          {#if confirmingSend}
            <span>Click Again to Send</span>
          {:else if onboardStatus === "not-sent"}
            <span>Send Welcome Email</span>
          {:else if onboardStatus === "pending"}
            <span>Send Welcome Email Again</span>
          {:else if onboardStatus === "done"}
            <span>Resend Welcome Email</span>
          {/if}
        </ChicletButton>
      </div>
    </div>
    <div>
      <div class="grid grid-cols-[24rem_24rem] gap-8">
        <div>
          <UserForm
            bind:user={data.user}
            titleClass="text-2xl font-semibold"
            showTitle={false}
            customFields={data.customFields}
          />
        </div>
        <div class="grip mt-9 gap-4 px-4 py-4">
        <!-- <div
						class="flex flex-col gap-2 text-sm font-medium text-stone-600 py-2.5 px-4 rounded-lg bg-stone-100 w-fit"
					>
					{#if data.ticket}
						{#if data.ticket.user.id === data.ticket.assignedTo}
							Claimed their own ticket
						{:else}
							Ticket purchased by
							{data.ticket.user.firstName}
							{data.ticket.user.lastName}
						{/if}
					{:else}
						No ticket purchased (probably comped)
					{/if}
				</div> -->
        <label class="block pb-2.5 pt-3.5 text-sm font-semibold"
          >Profile QR Code</label
        >
        <div class="">
          <img src={data.qrcode} class="w-[10rem]" />
        </div>
          {#if data?.login_link}
            <label class="block pb-2.5 pt-3.5 text-sm font-semibold"
              >Login Link</label
            >
            <div class="">
              <input
                type="text"
                value={data?.login_link}
                readonly
                class="w-64 rounded-md border border-slate-300 p-1.5 text-sm"
                on:mouseover={selectLoginLink}
                on:mouseout={clearSelection}
              />
            </div>
          {/if}
          <div class="mt-4">
            <Label for="user_internalNotes" class="text-right"
              >Internal Notes</Label
            >
            <Textarea
              id="user_internalNotes"
              bind:value={data.user.internalNotes}
              class="w-full"
              rows="4"
              placeholder="Add internal notes about this attendee..."
            />
          </div>
        </div>
      </div>
    </div>
  </AdminScreen>
{/key}
