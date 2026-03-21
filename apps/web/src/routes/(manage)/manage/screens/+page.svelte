<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import * as Select from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea";
  import {
    describeScreenBackdrop,
    encodeScreenBackdropPreset,
    getScreenBackdropPreset,
    screenBackdropPresets,
    type ScreenBackdropPresetId,
  } from "$lib/screen/screenBackdropPresets";
  import { trpc } from "$lib/trpc/client";
  import Plus from "lucide-svelte/icons/plus";
  import RefreshCw from "lucide-svelte/icons/refresh-cw";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import { toast } from "svelte-sonner";

  import { dayjs } from "@matterloop/util";

  import AdminScreen from "../AdminScreen.svelte";

  export let data;

  type ScreenConfigForm = {
    mode: "upcoming_events" | "message" | "image";
    notificationEnabled: boolean;
    notificationMessage: string;
    notificationPosition: "top" | "bottom";
    timeOverrideAt: string;
    messageBody: string;
    screenProfileId: string;
    imageUrl: string;
    backgroundStyles: string;
  };

  type ScreenRowForm = {
    id: string;
    key: string;
    name: string;
    status: "active" | "inactive";
    hasOverride: boolean;
    config: ScreenConfigForm;
  };

  type ScreenProfileConfigForm = {
    mode: "upcoming_events" | "message" | "image";
    messageBody: string;
    imageUrl: string;
    backgroundStyles: string;
  };

  type ScreenProfileForm = {
    id: string;
    name: string;
    config: ScreenProfileConfigForm;
  };

  type SelectOption = {
    value: string;
    label?: string;
  };

  function blankConfigForm(): ScreenConfigForm {
    return {
      mode: "upcoming_events",
      notificationEnabled: false,
      notificationMessage: "",
      notificationPosition: "top",
      timeOverrideAt: "",
      messageBody: "",
      screenProfileId: "",
      imageUrl: "",
      backgroundStyles: "",
    };
  }

  function padDatePart(value: number) {
    return String(value).padStart(2, "0");
  }

  function formatLocalDateTime(date: Date) {
    return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
      date.getDate(),
    )} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
  }

  function getTodayDateString() {
    return dayjs().format("YYYY-MM-DD");
  }

  function formatDisplayDateTime(dateValue: string, timeValue: string) {
    const normalized = `${dateValue} ${timeValue}`;
    return dayjs(normalized).isValid()
      ? dayjs(normalized).format("MMM D, YYYY h:mm A")
      : normalized;
  }

  function parseLocalTimeOverride(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return { date: "", time: "" };
    }

    const localMatch = trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
    );
    if (localMatch) {
      const [, year, month, day, hour, minute] = localMatch;
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`,
      };
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return { date: "", time: "" };
    }

    return {
      date: `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
        date.getDate(),
      )}`,
      time: `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
    };
  }

  function composeLocalTimeOverride(dateValue: string, timeValue: string) {
    if (!dateValue && !timeValue) return "";
    const resolvedDate = dateValue || getTodayDateString();
    const resolvedTime = timeValue || "09:00";
    return `${resolvedDate} ${resolvedTime}`;
  }

  function getTimeOverrideDate(value: string) {
    return parseLocalTimeOverride(value).date;
  }

  function getTimeOverrideTime(value: string) {
    return parseLocalTimeOverride(value).time;
  }

  function toStoredTimeOverrideValue(dateValue: string, timeValue: string) {
    if (!dateValue || !timeValue) return null;
    return `${dateValue} ${timeValue}:00`;
  }

  function updateTimeOverrideDate(currentValue: string, nextDate: string) {
    if (!nextDate) return "";
    return composeLocalTimeOverride(
      nextDate,
      getTimeOverrideTime(currentValue),
    );
  }

  function updateTimeOverrideTime(currentValue: string, nextTime: string) {
    if (!nextTime && !getTimeOverrideDate(currentValue)) return "";
    return composeLocalTimeOverride(
      getTimeOverrideDate(currentValue),
      nextTime,
    );
  }

  function formatTimeOverrideInput(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return "";
    const { date, time } = parseLocalTimeOverride(value);
    return date && time ? `${date} ${time}` : "";
  }

  function normalizeTimeOverrideInput(value: string) {
    const { date, time } = parseLocalTimeOverride(value);
    return toStoredTimeOverrideValue(date, time);
  }

  function describeTimeOverride(value: string) {
    const { date, time } = parseLocalTimeOverride(value);
    return date && time
      ? `Clock: ${formatDisplayDateTime(date, time)} override`
      : "Clock: Real time";
  }

  function blankProfileConfigForm(): ScreenProfileConfigForm {
    return {
      mode: "upcoming_events",
      messageBody: "",
      imageUrl: "",
      backgroundStyles: "",
    };
  }

  function toConfigForm(config: any): ScreenConfigForm {
    const mode =
      config?.mode === "message"
        ? "message"
        : config?.mode === "image" || config?.mode === "logo"
          ? "image"
          : "upcoming_events";
    return {
      mode,
      notificationEnabled: !!config?.notificationEnabled,
      notificationMessage: config?.notificationMessage || "",
      notificationPosition:
        config?.notificationPosition === "bottom" ? "bottom" : "top",
      timeOverrideAt: formatTimeOverrideInput(config?.timeOverrideAt),
      messageBody: config?.messageBody || "",
      screenProfileId:
        typeof config?.screenProfileId === "string"
          ? config.screenProfileId
          : "",
      imageUrl: typeof config?.imageUrl === "string" ? config.imageUrl : "",
      backgroundStyles:
        typeof config?.backgroundStyles === "string"
          ? config.backgroundStyles
          : "",
    };
  }

  function toConfigPayload(config: ScreenConfigForm) {
    return {
      mode: config.mode,
      notificationEnabled: config.notificationEnabled,
      notificationMessage: config.notificationMessage?.trim() || null,
      notificationPosition: config.notificationPosition,
      timeOverrideAt: normalizeTimeOverrideInput(config.timeOverrideAt),
      messageBody: config.messageBody?.trim() || null,
      screenProfileId: config.screenProfileId?.trim() || null,
      imageUrl: config.imageUrl?.trim() || null,
      backgroundStyles: config.backgroundStyles?.trim() || null,
    };
  }

  function toProfileConfigForm(config: any): ScreenProfileConfigForm {
    const mode =
      config?.mode === "message"
        ? "message"
        : config?.mode === "image" || config?.mode === "logo"
          ? "image"
          : "upcoming_events";

    return {
      mode,
      messageBody: config?.messageBody || "",
      imageUrl: typeof config?.imageUrl === "string" ? config.imageUrl : "",
      backgroundStyles:
        typeof config?.backgroundStyles === "string"
          ? config.backgroundStyles
          : "",
    };
  }

  function toProfileConfigPayload(config: ScreenProfileConfigForm) {
    return {
      mode: config.mode,
      messageBody: config.messageBody?.trim() || null,
      imageUrl: config.imageUrl?.trim() || null,
      backgroundStyles: config.backgroundStyles?.trim() || null,
    };
  }

  function toProfileForm(
    profile?: any,
    configOverride?: ScreenProfileConfigForm,
  ): ScreenProfileForm {
    const normalizedConfig = configOverride
      ? { ...configOverride }
      : profile?.config
        ? { ...profile.config }
        : toProfileConfigForm(profile);

    return {
      id: profile?.id || "",
      name: profile?.name || "",
      config: normalizedConfig,
    };
  }

  function getErrorMessage(e: unknown, fallback: string) {
    if (
      typeof e === "object" &&
      e &&
      "message" in e &&
      typeof e.message === "string"
    ) {
      return e.message;
    }
    return fallback;
  }

  const customProfileOption: SelectOption = {
    value: "",
    label: "Custom / legacy settings",
  };
  const noBackdropOption = "__none__";
  const customBackdropOption = "__custom__";

  let globalConfig: ScreenConfigForm = blankConfigForm();
  let rows: ScreenRowForm[] = [];
  let profiles: ScreenProfileForm[] = [];

  let savingGlobal = false;
  let creating = false;
  let broadcastingHardRefresh = false;
  let rowSaving = "";
  let overrideSaving = "";

  let profilesOpen = false;
  let savingProfile = false;
  let deletingProfileId = "";
  let profileForm: ScreenProfileForm = toProfileForm(
    undefined,
    blankProfileConfigForm(),
  );
  let profileBackdropEditorMode = deriveBackdropEditorMode(
    profileForm.config.backgroundStyles,
  );

  function getProfileById(profileId: string) {
    return profiles.find((profile) => profile.id === profileId);
  }

  function getProfileOption(profileId: string): SelectOption {
    const profile = getProfileById(profileId);
    return profile
      ? { value: profile.id, label: profile.name }
      : customProfileOption;
  }

  $: if (data) {
    profiles = data.profiles.map((profile) => toProfileForm(profile));
    globalConfig = toConfigForm(data.global.config);
    rows = data.screens.map((screen) => ({
      id: screen.id,
      key: screen.key,
      name: screen.name,
      status: screen.status === "inactive" ? "inactive" : "active",
      hasOverride: !!screen.config,
      config: toConfigForm(screen.config || data.global.config),
    }));
  }

  function applySelectedProfile(config: ScreenConfigForm): ScreenConfigForm {
    if (!config.screenProfileId) {
      return {
        ...config,
        screenProfileId: "",
      };
    }

    const profile = getProfileById(config.screenProfileId);
    if (!profile) return config;

    return {
      ...config,
      mode: profile.config.mode,
      messageBody: profile.config.messageBody,
      imageUrl: profile.config.imageUrl,
      backgroundStyles: profile.config.backgroundStyles,
      screenProfileId: profile.id,
    };
  }

  function applyProfileOption(
    config: ScreenConfigForm,
    option: SelectOption | undefined,
  ): ScreenConfigForm {
    return applySelectedProfile({
      ...config,
      screenProfileId: option?.value || "",
    });
  }

  function getSelectedConfig(config: ScreenConfigForm) {
    if (!config.screenProfileId) return config;
    const profile = getProfileById(config.screenProfileId);
    if (!profile) return config;
    return {
      ...config,
      mode: profile.config.mode,
      messageBody: profile.config.messageBody,
      imageUrl: profile.config.imageUrl,
      backgroundStyles: profile.config.backgroundStyles,
      screenProfileId: profile.id,
    };
  }

  function getProfileName(profileId: string) {
    return getProfileById(profileId)?.name || "Unknown profile";
  }

  function getConfigSummary(config: ScreenConfigForm) {
    const selected = getSelectedConfig(config);
    const lines = [
      selected.mode === "upcoming_events"
        ? "Mode: Upcoming events"
        : selected.mode === "message"
          ? "Mode: Full-screen message"
          : "Mode: Centered image",
      `Backdrop: ${describeScreenBackdrop(selected.backgroundStyles)}`,
      describeTimeOverride(selected.timeOverrideAt),
      selected.notificationEnabled
        ? `Banner: ${selected.notificationMessage || "Enabled"} (${selected.notificationPosition})`
        : "Banner: Hidden",
    ];

    if (selected.mode === "message" && selected.messageBody?.trim()) {
      lines.push(`Message: ${selected.messageBody.trim()}`);
    }

    if (selected.mode === "image") {
      lines.push(`Image: ${selected.imageUrl?.trim() || "Not set"}`);
    }

    return lines;
  }

  function getProfileConfigSummary(config: ScreenProfileConfigForm) {
    const lines = [
      config.mode === "upcoming_events"
        ? "Mode: Upcoming events"
        : config.mode === "message"
          ? "Mode: Full-screen message"
          : "Mode: Centered image",
      `Backdrop: ${describeScreenBackdrop(config.backgroundStyles)}`,
    ];

    if (config.mode === "message" && config.messageBody?.trim()) {
      lines.push(`Message: ${config.messageBody.trim()}`);
    }

    if (config.mode === "image") {
      lines.push(`Image: ${config.imageUrl?.trim() || "Not set"}`);
    }

    return lines;
  }

  function deriveBackdropEditorMode(backgroundStyles: string) {
    const preset = getScreenBackdropPreset(backgroundStyles);
    if (preset) return preset.id;
    return backgroundStyles?.trim() ? customBackdropOption : noBackdropOption;
  }

  function setProfileBackdropSelection(selection: string) {
    profileBackdropEditorMode = selection;
    if (selection === noBackdropOption) {
      profileForm = {
        ...profileForm,
        config: {
          ...profileForm.config,
          backgroundStyles: "",
        },
      };
      return;
    }

    if (selection === customBackdropOption) {
      profileForm = {
        ...profileForm,
        config: {
          ...profileForm.config,
          backgroundStyles: getScreenBackdropPreset(
            profileForm.config.backgroundStyles,
          )
            ? ""
            : profileForm.config.backgroundStyles,
        },
      };
      return;
    }

    profileForm = {
      ...profileForm,
      config: {
        ...profileForm.config,
        backgroundStyles: encodeScreenBackdropPreset(
          selection as ScreenBackdropPresetId,
        ),
      },
    };
  }

  function openProfiles() {
    profilesOpen = true;
    if (!profileForm.id && profiles[0]) {
      profileForm = toProfileForm(profiles[0]);
      profileBackdropEditorMode = deriveBackdropEditorMode(
        profileForm.config.backgroundStyles,
      );
    }
  }

  function openNewProfileFromConfig(
    config: ScreenConfigForm,
    suggestedName = "",
  ) {
    const selected = getSelectedConfig(config);
    profileForm = toProfileForm(undefined, {
      mode: selected.mode,
      messageBody: selected.messageBody,
      imageUrl: selected.imageUrl,
      backgroundStyles: selected.backgroundStyles,
    });
    profileForm.name = suggestedName;
    profileBackdropEditorMode = deriveBackdropEditorMode(
      profileForm.config.backgroundStyles,
    );
    profilesOpen = true;
  }

  function selectProfileForEditing(profileId: string) {
    const profile = getProfileById(profileId);
    if (!profile) return;
    profileForm = toProfileForm(profile);
    profileBackdropEditorMode = deriveBackdropEditorMode(
      profileForm.config.backgroundStyles,
    );
  }

  async function refresh() {
    await invalidateAll();
  }

  async function saveGlobalConfig() {
    try {
      savingGlobal = true;
      await trpc().screen.upsertGlobalConfig.mutate(
        toConfigPayload(globalConfig),
      );
      toast.success("Saved global screen defaults");
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save global defaults"));
    } finally {
      savingGlobal = false;
    }
  }

  async function createScreen() {
    try {
      creating = true;
      await trpc().screen.create.mutate({});
      toast.success("Created screen");
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to create screen"));
    } finally {
      creating = false;
    }
  }

  async function saveScreenMeta(row: ScreenRowForm) {
    try {
      rowSaving = row.id;
      await trpc().screen.update.mutate({
        id: row.id,
        name: row.name?.trim() || `Screen ${row.key}`,
        status: row.status,
      });
      toast.success(`Saved screen ${row.key}`);
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save screen"));
    } finally {
      rowSaving = "";
    }
  }

  async function saveOverride(row: ScreenRowForm) {
    try {
      overrideSaving = row.id;
      await trpc().screen.upsertScreenConfig.mutate({
        screenId: row.id,
        config: toConfigPayload(row.config),
      });
      toast.success(`Saved override for screen ${row.key}`);
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save override"));
    } finally {
      overrideSaving = "";
    }
  }

  async function clearOverride(row: ScreenRowForm) {
    try {
      overrideSaving = row.id;
      await trpc().screen.clearScreenConfig.mutate({ screenId: row.id });
      toast.success(`Cleared override for screen ${row.key}`);
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to clear override"));
    } finally {
      overrideSaving = "";
    }
  }

  async function saveProfile() {
    try {
      savingProfile = true;
      if (!profileForm.name.trim()) {
        toast.error("Profile name is required");
        return;
      }

      if (profileForm.id) {
        const updated = await trpc().screen.updateProfile.mutate({
          id: profileForm.id,
          name: profileForm.name.trim(),
          config: toProfileConfigPayload(profileForm.config),
        });
        if (updated) {
          profileForm = toProfileForm(updated);
          profileBackdropEditorMode = deriveBackdropEditorMode(
            profileForm.config.backgroundStyles,
          );
        }
        toast.success("Profile updated");
      } else {
        const created = await trpc().screen.createProfile.mutate({
          name: profileForm.name.trim(),
          config: toProfileConfigPayload(profileForm.config),
        });
        profileForm = toProfileForm(created);
        profileBackdropEditorMode = deriveBackdropEditorMode(
          profileForm.config.backgroundStyles,
        );
        toast.success("Profile created");
      }

      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save profile"));
    } finally {
      savingProfile = false;
    }
  }

  async function deleteProfile(profileId: string) {
    if (
      !confirm(
        "Delete this screen profile? Existing applied screen states will keep their last saved settings.",
      )
    ) {
      return;
    }

    try {
      deletingProfileId = profileId;
      await trpc().screen.deleteProfile.mutate({ id: profileId });
      if (profileForm.id === profileId) {
        profileForm = toProfileForm(undefined, blankProfileConfigForm());
        profileBackdropEditorMode = deriveBackdropEditorMode(
          profileForm.config.backgroundStyles,
        );
      }
      toast.success("Profile deleted");
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to delete profile"));
    } finally {
      deletingProfileId = "";
    }
  }

  async function forceHardRefreshAllDisplays() {
    try {
      broadcastingHardRefresh = true;
      const res = await trpc().screen.broadcastHardRefresh.mutate();
      if (res?.ok) {
        toast.success("Hard refresh sent to all connected displays");
      } else {
        toast.error("Ably is not configured or publish failed");
      }
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to broadcast hard refresh"));
    } finally {
      broadcastingHardRefresh = false;
    }
  }
</script>

<AdminScreen title="Screens">
  <div class="flex items-center gap-4" slot="title">
    <Button
      variant="outline"
      class="h-7 py-[0.3rem] pl-1.5 pr-3"
      on:click={createScreen}
      disabled={creating}
    >
      <Plus class="mr-1 w-[1rem] text-slate-700" />
      {creating ? "Creating..." : "Add Screen"}
    </Button>
    <Button
      variant="outline"
      class="h-7 py-[0.3rem] pl-1.5 pr-3"
      on:click={openProfiles}
    >
      Manage Profiles
    </Button>
    <Button
      variant="outline"
      class="h-7 py-[0.3rem] pl-1.5 pr-3"
      on:click={forceHardRefreshAllDisplays}
      disabled={broadcastingHardRefresh}
      title="Full browser reload on every open /screen/* tab (after a deploy)"
    >
      <RefreshCw class="mr-1 h-[1rem] w-[1rem] text-slate-700" />
      {broadcastingHardRefresh ? "Sending…" : "Hard refresh displays"}
    </Button>
  </div>

  <div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
    <div class="mb-3 text-lg font-semibold text-stone-700">
      Global Screen State
    </div>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr),22rem]">
      <div>
        <Label for="global-screen-profile">Screen profile</Label>
        <div class="mt-1">
          <Select.Root
            selected={getProfileOption(globalConfig.screenProfileId)}
            onSelectedChange={(selected) => {
              globalConfig = applyProfileOption(globalConfig, selected);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select a profile" />
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>Screen profiles</Select.Label>
                <Select.Item
                  value={customProfileOption.value}
                  label={customProfileOption.label}
                >
                  {customProfileOption.label}
                </Select.Item>
                {#each profiles as profile}
                  <Select.Item value={profile.id} label={profile.name}>
                    {profile.name}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
            <Select.Input name="global-screen-profile" />
          </Select.Root>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" class="h-8" on:click={openProfiles}
            >Manage Profiles</Button
          >
          <Button
            variant="outline"
            class="h-8"
            on:click={() =>
              openNewProfileFromConfig(globalConfig, "Global profile")}
          >
            Save Current as Profile
          </Button>
        </div>
        <label
          class="mt-4 flex items-center gap-2 text-sm font-medium text-stone-700"
        >
          <input
            type="checkbox"
            bind:checked={globalConfig.notificationEnabled}
          />
          Show notification banner
        </label>
        {#if globalConfig.notificationEnabled}
          <div class="mt-3 grid gap-3 lg:grid-cols-2">
            <div class="flex flex-col gap-1">
              <Label for="global-notification-message"
                >Notification message</Label
              >
              <Input
                id="global-notification-message"
                bind:value={globalConfig.notificationMessage}
                class="bg-white"
                placeholder="Banner text"
              />
            </div>
            <div class="flex flex-col gap-1">
              <Label for="global-notification-position"
                >Notification position</Label
              >
              <select
                id="global-notification-position"
                class="rounded-md border border-stone-200 bg-white px-3 py-2"
                bind:value={globalConfig.notificationPosition}
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        {/if}
        <div class="mt-4 grid gap-2">
          <div class="text-sm font-medium text-stone-700">
            Upcoming time override
          </div>
          <div class="grid gap-3 sm:grid-cols-2 w-80">
            <input
              type="date"
              value={getTimeOverrideDate(globalConfig.timeOverrideAt)}
              on:input={(e) =>
                (globalConfig.timeOverrideAt = updateTimeOverrideDate(
                  globalConfig.timeOverrideAt,
                  e.currentTarget.value,
                ))}
              class="flex h-9 w-48 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              type="time"
              step="60"
              value={getTimeOverrideTime(globalConfig.timeOverrideAt)}
              on:input={(e) =>
                (globalConfig.timeOverrideAt = updateTimeOverrideTime(
                  globalConfig.timeOverrideAt,
                  e.currentTarget.value,
                ))}
              class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div class="text-xs text-stone-500">
            If you only pick a time, today is assumed. Clear the date to use the
            real clock. This is saved in the backend and applied to screens
            automatically.
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-3">
        <div class="text-sm font-semibold text-stone-700">
          {#if globalConfig.screenProfileId}
            Using profile: {getProfileName(globalConfig.screenProfileId)}
          {:else}
            Using custom / legacy settings
          {/if}
        </div>
        <div class="mt-2 space-y-1 text-sm text-stone-600">
          {#each getConfigSummary(globalConfig) as line}
            <div>{line}</div>
          {/each}
        </div>
      </div>
    </div>
    <div class="mt-4 flex items-center gap-2">
      <Button class="h-8" on:click={saveGlobalConfig} disabled={savingGlobal}>
        {savingGlobal ? "Saving..." : "Save Global State"}
      </Button>
      <Button variant="outline" class="h-8" on:click={refresh}>Refresh</Button>
    </div>
  </div>

  <div class="mt-6 overflow-hidden rounded-xl border border-stone-200">
    <div
      class="border-b border-stone-200 bg-stone-100/70 px-4 py-2 text-sm font-semibold text-stone-700"
    >
      Screens
    </div>
    <table class="w-full border-collapse">
      <thead
        class="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"
      >
        <tr>
          <th class="px-3 py-2">ID</th>
          <th class="px-3 py-2">Name</th>
          <th class="px-3 py-2">Status</th>
          <th class="px-3 py-2">Config</th>
          <th class="px-3 py-2">Preview URL</th>
          <th class="px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if rows.length === 0}
          <tr>
            <td
              colspan="6"
              class="px-3 py-6 text-center text-sm text-stone-500"
            >
              No screens yet. Create your first screen.
            </td>
          </tr>
        {:else}
          {#each rows as row}
            <tr class="border-t border-stone-100 align-top text-sm">
              <td class="px-3 py-3 font-semibold text-stone-700">{row.key}</td>
              <td class="px-3 py-3">
                <Input bind:value={row.name} class="bg-white" />
              </td>
              <td class="px-3 py-3">
                <select
                  class="rounded-md border border-stone-200 bg-white px-2 py-2"
                  bind:value={row.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </td>
              <td class="px-3 py-3">
                {#if row.hasOverride}
                  <div
                    class="mb-2 rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700"
                  >
                    Using override
                  </div>
                  <div
                    class="space-y-3 rounded border border-stone-200 bg-white p-3"
                  >
                    <div class="flex flex-col gap-1">
                      <Label
                        for="screen-profile-{row.id}"
                        class="text-xs text-stone-700">Profile</Label
                      >
                      <Select.Root
                        selected={getProfileOption(row.config.screenProfileId)}
                        onSelectedChange={(selected) => {
                          row.config = applyProfileOption(row.config, selected);
                        }}
                      >
                        <Select.Trigger class="w-full">
                          <Select.Value placeholder="Select a profile" />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Group>
                            <Select.Label>Screen profiles</Select.Label>
                            <Select.Item
                              value=""
                              label="Custom / legacy override"
                            >
                              Custom / legacy override
                            </Select.Item>
                            {#each profiles as profile}
                              <Select.Item
                                value={profile.id}
                                label={profile.name}
                              >
                                {profile.name}
                              </Select.Item>
                            {/each}
                          </Select.Group>
                        </Select.Content>
                        <Select.Input name={"screen-profile-" + row.id} />
                      </Select.Root>
                    </div>
                    <div
                      class="rounded-md border border-stone-100 bg-stone-50 p-2 text-xs text-stone-600"
                    >
                      {#each getConfigSummary(row.config) as line}
                        <div>{line}</div>
                      {/each}
                    </div>
                    <label
                      class="flex items-center gap-2 text-xs font-medium text-stone-700"
                    >
                      <input
                        type="checkbox"
                        bind:checked={row.config.notificationEnabled}
                      />
                      Show notification banner
                    </label>
                    {#if row.config.notificationEnabled}
                      <div class="grid gap-2 lg:grid-cols-2">
                        <div class="flex flex-col gap-1">
                          <Label
                            for={"screen-notification-message-" + row.id}
                            class="text-xs text-stone-700"
                            >Notification message</Label
                          >
                          <Input
                            id={"screen-notification-message-" + row.id}
                            bind:value={row.config.notificationMessage}
                            class="bg-white"
                            placeholder="Banner text"
                          />
                        </div>
                        <div class="flex flex-col gap-1">
                          <Label
                            for={"screen-notification-position-" + row.id}
                            class="text-xs text-stone-700"
                            >Notification position</Label
                          >
                          <select
                            id={"screen-notification-position-" + row.id}
                            class="rounded-md border border-stone-200 bg-white px-2 py-2"
                            bind:value={row.config.notificationPosition}
                          >
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </div>
                      </div>
                    {/if}
                    <div class="grid gap-1">
                      <div class="text-xs font-medium text-stone-700">
                        Upcoming time override
                      </div>
                      <div class="grid gap-2 sm:grid-cols-2">
                        <input
                          type="date"
                          value={getTimeOverrideDate(row.config.timeOverrideAt)}
                          on:input={(e) =>
                            (row.config.timeOverrideAt = updateTimeOverrideDate(
                              row.config.timeOverrideAt,
                              e.currentTarget.value,
                            ))}
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <input
                          type="time"
                          step="60"
                          value={getTimeOverrideTime(row.config.timeOverrideAt)}
                          on:input={(e) =>
                            (row.config.timeOverrideAt = updateTimeOverrideTime(
                              row.config.timeOverrideAt,
                              e.currentTarget.value,
                            ))}
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div class="text-xs text-stone-500">
                        If you only pick a time, today is assumed. Clear the
                        date to use the real clock. Clear the override to
                        inherit the global state again.
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        class="h-7"
                        on:click={() => saveOverride(row)}
                        disabled={overrideSaving === row.id}
                      >
                        {overrideSaving === row.id
                          ? "Saving..."
                          : "Save Override"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        class="h-7"
                        on:click={() => clearOverride(row)}
                        disabled={overrideSaving === row.id}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        class="h-7"
                        on:click={() =>
                          openNewProfileFromConfig(
                            row.config,
                            `${row.name} profile`,
                          )}
                      >
                        Save as Profile
                      </Button>
                    </div>
                  </div>
                {:else}
                  <div
                    class="mb-2 rounded bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600"
                  >
                    Using global defaults
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    class="h-7"
                    on:click={() => {
                      row.config = { ...toConfigForm(globalConfig) };
                      row.hasOverride = true;
                    }}
                  >
                    Add Override
                  </Button>
                {/if}
              </td>
              <td class="px-3 py-3">
                <a
                  class="text-sky-700 underline"
                  href={`/screen/${row.key}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  /screen/{row.key}
                </a>
              </td>
              <td class="px-3 py-3">
                <Button
                  size="sm"
                  class="h-7"
                  on:click={() => saveScreenMeta(row)}
                  disabled={rowSaving === row.id}
                >
                  {rowSaving === row.id ? "Saving..." : "Save"}
                </Button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</AdminScreen>

<Dialog.Root bind:open={profilesOpen}>
  <Dialog.Content class="max-h-[90vh] overflow-hidden p-0 sm:max-w-[1100px]">
    <div class="flex h-[85vh] flex-col">
      <Dialog.Header class="border-b border-stone-200 px-6 py-4">
        <Dialog.Title>Screen Profiles</Dialog.Title>
        <Dialog.Description>
          Save reusable screen states with a name, then apply them from the main
          screens panel.
        </Dialog.Description>
      </Dialog.Header>

      <div class="grid min-h-0 flex-1 grid-cols-[18rem,minmax(0,1fr)]">
        <div
          class="min-h-0 overflow-y-auto border-r border-stone-200 bg-stone-50 p-4"
        >
          <div class="flex flex-col gap-2">
            <Button
              variant="outline"
              class="justify-start"
              on:click={() => openNewProfileFromConfig(blankConfigForm())}
            >
              <Plus class="mr-2 h-4 w-4" />
              New Blank Profile
            </Button>
            <Button
              variant="outline"
              class="justify-start"
              on:click={() =>
                openNewProfileFromConfig(globalConfig, "Global profile")}
            >
              <Plus class="mr-2 h-4 w-4" />
              New From Global State
            </Button>
          </div>

          <div class="mt-4 space-y-2">
            {#if profiles.length === 0}
              <div
                class="rounded-md border border-dashed border-stone-300 bg-white p-3 text-sm text-stone-500"
              >
                No profiles yet.
              </div>
            {:else}
              {#each profiles as profile}
                <button
                  class="w-full rounded-lg border px-3 py-3 text-left transition {profileForm.id ===
                  profile.id
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'}"
                  on:click={() => selectProfileForEditing(profile.id)}
                >
                  <div class="font-medium text-stone-800">{profile.name}</div>
                  <div class="mt-1 text-xs text-stone-500">
                    {getProfileConfigSummary(profile.config)[0]}
                  </div>
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <form
          class="min-h-0 overflow-y-auto p-6"
          on:submit|preventDefault={saveProfile}
        >
          <div class="grid gap-5">
            <div class="grid gap-2">
              <Label for="screen-profile-name">Profile name</Label>
              <Input
                id="screen-profile-name"
                bind:value={profileForm.name}
                placeholder="e.g. Main lobby welcome"
                class="bg-white"
              />
            </div>

            <div class="grid gap-2">
              <div class="grid gap-2">
                <Label for="screen-profile-mode">Mode</Label>
                <select
                  id="screen-profile-mode"
                  class="rounded-md border border-stone-200 bg-white px-3 py-2"
                  bind:value={profileForm.config.mode}
                >
                  <option value="upcoming_events">Upcoming events</option>
                  <option value="message">Full-screen message</option>
                  <option value="image">Centered image</option>
                </select>
              </div>
            </div>

            {#if profileForm.config.mode === "message"}
              <div class="grid gap-2">
                <Label for="screen-profile-message">Message</Label>
                <Textarea
                  id="screen-profile-message"
                  bind:value={profileForm.config.messageBody}
                  class="min-h-[10rem] bg-white"
                  placeholder="Full-screen message"
                />
              </div>
            {/if}

            {#if profileForm.config.mode === "image"}
              <div class="grid gap-4 lg:grid-cols-2">
                <div class="grid gap-2">
                  <Label for="screen-profile-image-url">Image URL</Label>
                  <Input
                    id="screen-profile-image-url"
                    bind:value={profileForm.config.imageUrl}
                    class="bg-white font-mono text-sm"
                    placeholder="https://… or /…"
                  />
                </div>
              </div>
            {/if}

            <div class="grid gap-3">
              <!--  <div>
                <Label>Backdrop</Label>
                <div class="mt-1 text-sm text-stone-500">
                  Transparent ambient layers over a safe slate base, lightly
                  tinted toward the event accent when one exists.
                </div>
              </div>
              <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  class="rounded-lg border px-3 py-3 text-left transition {profileBackdropEditorMode ===
                  noBackdropOption
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'}"
                  on:click={() => setProfileBackdropSelection(noBackdropOption)}
                >
                  <div class="font-medium text-stone-800">Plain slate base</div>
                  <div class="mt-1 text-sm text-stone-500">
                    No extra ambient layer. Clean and minimal.
                  </div>
                </button>

                {#each screenBackdropPresets as preset}
                  <button
                    type="button"
                    class="rounded-lg border px-3 py-3 text-left transition {profileBackdropEditorMode ===
                    preset.id
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'}"
                    on:click={() => setProfileBackdropSelection(preset.id)}
                  >
                    <div class="font-medium text-stone-800">{preset.label}</div>
                    <div class="mt-1 text-sm text-stone-500">
                      {preset.description}
                    </div>
                  </button>
                {/each}

                <button
                  type="button"
                  class="rounded-lg border px-3 py-3 text-left transition {profileBackdropEditorMode ===
                  customBackdropOption
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'}"
                  on:click={() =>
                    setProfileBackdropSelection(customBackdropOption)}
                >
                  <div class="font-medium text-stone-800">Custom Tailwind</div>
                  <div class="mt-1 text-sm text-stone-500">
                    Manual class list for one-off gradients or utility-based
                    backdrops.
                  </div>
                </button>
              </div> -->

              {#if profileBackdropEditorMode === customBackdropOption}
                <div class="grid gap-2">
                  <Label for="screen-profile-background"
                    >Custom background classes</Label
                  >
                  <Input
                    id="screen-profile-background"
                    bind:value={profileForm.config.backgroundStyles}
                    class="bg-white font-mono text-sm"
                    placeholder="opacity-60 bg-gradient-to-br from-slate-700 to-slate-900"
                  />
                  <div class="text-xs text-stone-500">
                    These classes render on a background layer below the screen
                    content.
                  </div>
                </div>
              {/if}
            </div>

            <div class="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div class="text-sm font-semibold text-stone-700">
                Profile summary
              </div>
              <div class="mt-2 space-y-1 text-sm text-stone-600">
                {#each getProfileConfigSummary(profileForm.config) as line}
                  <div>{line}</div>
                {/each}
              </div>
            </div>
          </div>

          <Dialog.Footer
            class="mt-6 flex items-center justify-between gap-2 border-t border-stone-200 pt-4"
          >
            <div>
              {#if profileForm.id}
                <Button
                  type="button"
                  variant="outline"
                  class="text-red-600 hover:bg-red-50 hover:text-red-700"
                  on:click={() => deleteProfile(profileForm.id)}
                  disabled={deletingProfileId === profileForm.id}
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  {deletingProfileId === profileForm.id
                    ? "Deleting..."
                    : "Delete"}
                </Button>
              {/if}
            </div>
            <div class="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                on:click={() => (profilesOpen = false)}>Close</Button
              >
              <Button type="submit" disabled={savingProfile}>
                {savingProfile
                  ? "Saving..."
                  : profileForm.id
                    ? "Save Profile"
                    : "Create Profile"}
              </Button>
            </div>
          </Dialog.Footer>
        </form>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
