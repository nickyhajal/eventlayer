<script lang="ts">
  import Calendar from "lucide-svelte/icons/calendar";
  import Mail from "lucide-svelte/icons/mail";
  import Ticket from "lucide-svelte/icons/ticket";
  import Users from "lucide-svelte/icons/users";
  import { onDestroy, onMount } from "svelte";

  import { dayjs, startCase } from "@matterloop/util";

  import AdminScreen from "./AdminScreen.svelte";

  type UserTypeCount = {
    type: string;
    count: number;
  };

  type DashboardStats = {
    totalUsers: number;
    userTypeCounts: UserTypeCount[];
    totalEvents: number;
    totalSponsors: number;
    totalTickets: number;
    claimedTickets: number;
    unclaimedTickets: number;
    onboardCounts: {
      sent: number;
      done: number;
      notSent: number;
    };
    attendees: number;
    assignedTickets: number;
    unassignedTickets: number;
    onboardingCompleted: number;
    checkinsCompleted: number;
  };

  const emptyStats: DashboardStats = {
    totalUsers: 0,
    userTypeCounts: [],
    totalEvents: 0,
    totalSponsors: 0,
    totalTickets: 0,
    claimedTickets: 0,
    unclaimedTickets: 0,
    onboardCounts: {
      sent: 0,
      done: 0,
      notSent: 0,
    },
    attendees: 0,
    assignedTickets: 0,
    unassignedTickets: 0,
    onboardingCompleted: 0,
    checkinsCompleted: 0,
  };

  export let data;

  $: stats = (data.stats ?? emptyStats) as DashboardStats;
  $: event = data.event;
  $: startsAt = event?.startsAt ? dayjs(event.startsAt) : null;

  let now = dayjs();
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    interval = setInterval(() => {
      now = dayjs();
    }, 60000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  const getPercent = (value: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round((value / total) * 100);
  };

  $: daysUntil = startsAt ? startsAt.diff(now, "day") : null;
  $: hoursUntil = startsAt ? startsAt.diff(now, "hour") % 24 : null;
  $: isPast = startsAt ? startsAt.isBefore(now) : false;
  $: attendees = stats.attendees || stats.totalUsers;
  $: assignedTickets = stats.assignedTickets || stats.claimedTickets;
  $: unassignedTickets = stats.unassignedTickets || stats.unclaimedTickets;
  $: onboardingCompleted =
    stats.onboardingCompleted || stats.onboardCounts.done;
  $: checkinsCompleted = stats.checkinsCompleted || 0;
  $: totalTickets = assignedTickets + unassignedTickets;
  $: ticketsAssignedPercent = getPercent(assignedTickets, totalTickets);
  $: attendeesOnboardedPercent = getPercent(onboardingCompleted, attendees);
  $: attendeesCheckedInPercent = getPercent(checkinsCompleted, attendees);
</script>

<AdminScreen>
  <div class="">
    <div class="mb-6 text-2xl font-semibold">Dashboard</div>
    {#if startsAt}
      <div
        class="mt-6 rounded-lg mb-4 bg-gradient-to-r bg-sky-100/40 text-sky-900 p-6"
      >
        <div class="flex items-center gap-3 text-sm font-medium">
          <Calendar class="h-4 w-4" />
          {#if isPast}
            {event?.name} is happening!
          {:else}
            {event?.name} starts in {daysUntil} days and {hoursUntil} hours!
          {/if}
        </div>
      </div>
    {/if}
    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-3 text-sm font-medium text-gray-500">
          Tickets Assigned
        </div>
        <div class="text-4xl font-bold leading-none text-gray-900">
          {ticketsAssignedPercent}%
        </div>
        <div class="mt-2 text-sm text-gray-500">
          {assignedTickets.toLocaleString()}/{totalTickets.toLocaleString()}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-3 text-sm font-medium text-gray-500">
          Attendees Onboarded
        </div>
        <div class="text-4xl font-bold leading-none text-gray-900">
          {attendeesOnboardedPercent}%
        </div>
        <div class="mt-2 text-sm text-gray-500">
          {onboardingCompleted.toLocaleString()}/{attendees.toLocaleString()}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-3 text-sm font-medium text-gray-500">
          Attendees Checked In
        </div>
        <div class="text-4xl font-bold leading-none text-gray-900">
          {attendeesCheckedInPercent}%
        </div>
        <div class="mt-2 text-sm text-gray-500">
          {checkinsCompleted.toLocaleString()}/{attendees.toLocaleString()}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-3 text-sm font-medium text-gray-500">
          Total Attendees
        </div>
        <div class="text-4xl font-bold leading-none text-gray-900">
          {attendees.toLocaleString()}
        </div>
        <div class="mt-2 text-sm text-gray-500">Registered attendees</div>
      </div>
    </div>

    <!-- <div class="mt-6 grid grid-cols-4 gap-4">
      <a
        href="/manage/people"
        class="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-sky-200 hover:bg-sky-50/30"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-stone-500">
          <Users class="h-4 w-4" />
          Total Attendees
        </div>
        <div class="mt-2 text-3xl font-bold text-stone-800">
          {stats.totalUsers}
        </div>
        {#if stats.userTypeCounts.length > 1}
          <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {#each stats.userTypeCounts as tc}
              <span class="text-xs text-stone-400">
                {tc.count}
                {startCase(tc.type || "other")}
              </span>
            {/each}
          </div>
        {/if}
      </a>

      <a
        href="/manage/tickets"
        class="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-sky-200 hover:bg-sky-50/30"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-stone-500">
          <Ticket class="h-4 w-4" />
          Tickets
        </div>
        <div class="mt-2 text-3xl font-bold text-stone-800">
          {stats.totalTickets}
        </div>
        <div class="mt-2 flex gap-3">
          <span class="text-xs text-green-600"
            >{stats.claimedTickets} claimed</span
          >
          <span class="text-xs text-amber-600"
            >{stats.unclaimedTickets} unclaimed</span
          >
        </div>
      </a>

      <a
        href="/manage/events"
        class="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-sky-200 hover:bg-sky-50/30"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-stone-500">
          <Calendar class="h-4 w-4" />
          Schedule
        </div>
        <div class="mt-2 text-3xl font-bold text-stone-800">
          {stats.totalEvents}
        </div>
        <div class="mt-2 text-xs text-stone-400">sub-events</div>
      </a>

      <a
        href="/manage/sponsors"
        class="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-sky-200 hover:bg-sky-50/30"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-stone-500">
          <Users class="h-4 w-4" />
          Sponsors
        </div>
        <div class="mt-2 text-3xl font-bold text-stone-800">
          {stats.totalSponsors}
        </div>
      </a>
    </div> -->

    <!-- <div class="mt-6 grid grid-cols-3 gap-4">
			<div class="rounded-xl border border-stone-200 bg-white p-5">
				<div class="flex items-center gap-2 text-sm font-medium text-stone-500">
					<Mail class="h-4 w-4" />
					Onboarding Status
				</div>
				<div class="mt-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-stone-600">Completed</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-24 overflow-hidden rounded-full bg-stone-100">
								<div
									class="h-full rounded-full bg-green-500"
									style="width: {stats.totalUsers ? (stats.onboardCounts.done / stats.totalUsers) * 100 : 0}%"
								/>
							</div>
							<span class="w-8 text-right text-sm font-semibold text-stone-700"
								>{stats.onboardCounts.done}</span
							>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-stone-600">Email Sent</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-24 overflow-hidden rounded-full bg-stone-100">
								<div
									class="h-full rounded-full bg-amber-400"
									style="width: {stats.totalUsers ? (stats.onboardCounts.sent / stats.totalUsers) * 100 : 0}%"
								/>
							</div>
							<span class="w-8 text-right text-sm font-semibold text-stone-700"
								>{stats.onboardCounts.sent}</span
							>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-stone-600">Not Sent</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-24 overflow-hidden rounded-full bg-stone-100">
								<div
									class="h-full rounded-full bg-stone-300"
									style="width: {stats.totalUsers
										? (stats.onboardCounts.notSent / stats.totalUsers) * 100
										: 0}%"
								/>
							</div>
							<span class="w-8 text-right text-sm font-semibold text-stone-700"
								>{stats.onboardCounts.notSent}</span
							>
						</div>
					</div>
				</div>
			</div> -->

    <!-- <div class="rounded-xl border border-stone-200 bg-white p-5">
				<div class="text-sm font-medium text-stone-500">Ticket Claim Rate</div>
				<div class="mt-4 flex items-end gap-3">
					<span class="text-4xl font-bold text-stone-800">
						{stats.totalTickets ? Math.round((stats.claimedTickets / stats.totalTickets) * 100) : 0}%
					</span>
					<span class="mb-1 text-sm text-stone-400">
						{stats.claimedTickets} of {stats.totalTickets} tickets claimed
					</span>
				</div>
				<div class="mt-3 h-3 w-full overflow-hidden rounded-full bg-stone-100">
					<div
						class="h-full rounded-full bg-green-500 transition-all"
						style="width: {stats.totalTickets ? (stats.claimedTickets / stats.totalTickets) * 100 : 0}%"
					/>
				</div>
			</div> -->

    <!-- <div class="rounded-xl border border-stone-200 bg-white p-5">
				<div class="text-sm font-medium text-stone-500">Attendees by Type</div>
				<div class="mt-4 space-y-2.5">
					{#each stats.userTypeCounts as tc}
						<div class="flex items-center justify-between">
							<span class="text-sm text-stone-600">{startCase(tc.type || 'Other')}</span>
							<div class="flex items-center gap-2">
								<div class="h-2 w-20 overflow-hidden rounded-full bg-stone-100">
									<div
										class="h-full rounded-full bg-sky-500"
										style="width: {stats.totalUsers ? (tc.count / stats.totalUsers) * 100 : 0}%"
									/>
								</div>
								<span class="w-8 text-right text-sm font-semibold text-stone-700">{tc.count}</span>
							</div>
						</div>
					{/each}
					{#if !stats.userTypeCounts.length}
						<span class="text-xs text-stone-400">No attendees yet</span>
					{/if}
				</div>
			</div> -->
    <!-- </div> -->
  </div>
</AdminScreen>
