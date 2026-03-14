<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { getEventContext } from "$lib/state/getContexts";
  import { post, trpc } from "$lib/trpc/client";
  import { tick } from "svelte";
  import { Pincode, PincodeInput } from "svelte-pincode";

  export let handleSuccess: undefined | ((id: string) => Promise<void>);
  let firstName = "";
  let lastName = "";
  let email = "";
  let password = "";
  let view = "login";
  let code = "";
  const CODE_LENGTH = 4;
  let codeChars = Array.from({ length: CODE_LENGTH }, () => "");
  let pincodeRef: { focusFirstInput?: () => void } | null = null;
  const event = getEventContext();
  let codeEmailSent = false;
  let loading = false;
  let loginError = "";

  function normalizeCodeChars(chars: string[]) {
    return chars.map((char) => char.toUpperCase());
  }

  $: {
    const normalized = normalizeCodeChars(codeChars);
    if (normalized.join("") !== codeChars.join("")) {
      codeChars = normalized;
    }
  }
  $: code = codeChars.join("");

  function updateCodeChars(next: string[]) {
    codeChars = normalizeCodeChars(next);
  }

  function setCodeFromText(
    text: string,
    startIndex = 0,
    inputs: HTMLInputElement[] = [],
  ) {
    const normalized = text
      .replace(/\s+/g, "")
      .slice(0, CODE_LENGTH - startIndex);
    if (!normalized.length) return;
    const next = [...codeChars];
    for (const [offset, char] of normalized.split("").entries()) {
      next[startIndex + offset] = char;
    }
    updateCodeChars(next);
    const nextIndex = Math.min(startIndex + normalized.length, CODE_LENGTH - 1);
    inputs[nextIndex]?.focus();
    inputs[nextIndex]?.select();
  }

  function onPincodeInput(event: Event) {
    loginError = "";
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== "INPUT") return;
    const wrapper = event.currentTarget as HTMLElement;
    const inputs = Array.from(
      wrapper.querySelectorAll("input"),
    ) as HTMLInputElement[];
    const index = inputs.indexOf(target);
    if (index < 0) return;
    const value = target.value;
    const next = [...codeChars];
    if (!value) {
      next[index] = "";
      updateCodeChars(next);
      if (index > 0) {
        inputs[index - 1]?.focus();
        inputs[index - 1]?.select();
      }
      return;
    }
    setCodeFromText(value, index, inputs);
    if (value.length === 1 && index < CODE_LENGTH - 1) {
      inputs[index + 1]?.focus();
      inputs[index + 1]?.select();
    }
  }

  async function showCodeEntry() {
    loginError = "";
    codeEmailSent = true;
    codeChars = Array.from({ length: CODE_LENGTH }, () => "");
    await tick();
    pincodeRef?.focusFirstInput?.();
  }

  async function getResponseJson(rsp: Response) {
    try {
      return await rsp.json();
    } catch {
      return null;
    }
  }

  async function submit(e?: Event | undefined) {
    if (loading) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (view === "login") {
      loginError = "";
      if (!code) {
        loading = true;
        const res = await trpc().user.sendMagicLinkEmail.mutate({ email });
        if (res) {
          await showCodeEntry();
        }
        loading = false;
      } else if (code.length === 4) {
        loading = true;
        try {
          const rsp = await post(`login`, { code: code.toUpperCase() });
          const data = await getResponseJson(rsp);
          if (!rsp.ok || data?.error || data?.success === false) {
            loginError = data?.error || "That code isn't valid";
            return;
          }
          if (handleSuccess) {
            const me = await trpc().me.get.query();
            if (me) {
              handleSuccess(me.id);
            }
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              for (const registration of registrations) {
                registration.unregister();
              }
            });
          }
          if (data) {
            window.location.pathname = "/";
            location.href = "/";
          }
        } catch (e) {
          console.log(e);
          loginError = "That code isn't valid";
        } finally {
          loading = false;
        }
      } else {
        loginError = "Enter your 4-character code";
      }
    } else {
      const rsp = await post(`signup`, {
        email,
        password,
        firstName,
        lastName,
      });
      const data = await rsp.json();
      return data;
    }
  }

  $: if (codeEmailSent && code.length === 4) {
    submit();
  }
</script>

<form
  on:submit|preventDefault|stopPropagation={submit}
  class="mx-auto w-11/12 pb-10 pt-3"
>
  {#if view === "login"}
    <div
      class="title -mt-2 mb-6 text-center text-2xl font-semibold text-slate-600"
    >
      Sign in to {$event?.name}
    </div>
    {#if !codeEmailSent}
      <div
        class="pb-8 text-center text-base font-medium leading-tight text-slate-500"
      >
        Enter your email below to get<br /> a magic link to login
      </div>
    {:else}
      <div
        class="pb-8 text-center text-base font-medium leading-tight text-slate-500"
      >
        Check your email! We sent you a code to login.
      </div>
    {/if}
    <div
      class="flex flex-col gap-3 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6"
    >
      {#if !codeEmailSent}
        <input
          class="rounded-md border border-slate-200 p-1 focus:outline-sky-300"
          type="email"
          placeholder="Email"
          bind:value={email}
        />
        <Button class="py-2" disabled={loading} type="submit"
          >Send Magic Link</Button
        >
      {:else}
        <div>
          <div class="text-center text-sm font-medium text-slate-500">
            Enter your code here
          </div>
          <div
            class="pinshell mx-auto flex w-72 justify-center pb-6 pt-4"
            on:input={onPincodeInput}
          >
            <Pincode
              bind:this={pincodeRef}
              bind:code={codeChars}
              selectTextOnFocus
            >
              <PincodeInput
                autocomplete="one-time-code"
                autocapitalize="characters"
                spellcheck="false"
              />
              <PincodeInput
                autocomplete="one-time-code"
                autocapitalize="characters"
                spellcheck="false"
              />
              <PincodeInput
                autocomplete="one-time-code"
                autocapitalize="characters"
                spellcheck="false"
              />
              <PincodeInput
                autocomplete="one-time-code"
                autocapitalize="characters"
                spellcheck="false"
              />
            </Pincode>
          </div>
        </div>
        {#if loginError}
          <div class="text-center text-sm font-semibold text-red-600">
            {loginError}
          </div>
        {/if}
        <Button disabled={loading} type="submit"
          >{loading ? "Logging In..." : "Login"}</Button
        >
      {/if}
    </div>
    {#if !codeEmailSent}
      <div class="mt-4 flex justify-center">
        <Button
          on:click={showCodeEntry}
          type="button"
          class="h-8 bg-white px-2 py-2 text-center text-xs text-slate-700 opacity-50 transition-all hover:opacity-100"
          variant="ghost"
          >I already have a code
        </Button>
      </div>
    {/if}
  {:else}
    <input
      class="rounded-md border border-slate-200 p-1"
      type="text"
      placeholder="First Name"
      bind:value={firstName}
    />
    <input
      class="rounded-md border border-slate-200 p-1"
      type="text"
      placeholder="Last Name"
      bind:value={lastName}
    />
    <input
      class="rounded-md border border-slate-200 p-1"
      type="text"
      placeholder="Email"
      bind:value={email}
    />
    <input
      class="rounded-md border border-slate-200 p-1"
      type="password"
      placeholder="Password"
      bind:value={password}
    />
    <button>Create Account</button>
  {/if}
</form>

<style lang="postcss">
  input {
    @apply px-3.5 py-2;
  }
  .pinshell :global(> div) {
    @apply flex gap-1.5;
    border: none;
  }
  .pinshell :global(> div input) {
    @apply rounded-lg;
    border: 2px solid #d1d5db70;
  }
  .pinshell :global(> div input:focus) {
    outline: 2px solid rgb(125 211 252);
    outline-offset: 1px;
  }
</style>
