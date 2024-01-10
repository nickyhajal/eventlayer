<script lang="ts">
	import { createEventDispatcher, type SvelteComponent } from 'svelte'
	import { ChevronLeft, ChevronRight } from '@steeze-ui/heroicons'
	import { dayjs } from '@matterloop/util'
	import Carousel from './Carousel.svelte'
	import HeroIcon from './HeroIcon.svelte'

	let className = ''
	export { className as class }
	export let contentComponent: typeof SvelteComponent
	export let items: CalendarEventItem[] = []

	type CalendarDay = {
		name: string
		enabled: boolean
		date: Date
	}
	type CalendarEventItem = {
		title: string
		startAt: Date
		startCol?: number
		startRow?: number
		event: any
	}

	let headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	let monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	]
	let now = new Date()
	let year = now.getFullYear() //	this is the month & year displayed
	let month = now.getMonth()
	let itemsByDay: Record<string, CalendarEventItem[]> = {}
	let days: CalendarDay[] = [] //	The days to display in each box

	const dispatch = createEventDispatcher()

	$: month, year, items, initContent()
	$: isThisMonth = `${year}-${month + 1}` === dayjs().format('YYYY-M')

	//	The Calendar Component just displays stuff in a row & column. It has no knowledge of dates.
	//	The items[] below are placed (by you) in a specified row & column of the calendar.
	//	You need to call findRowCol() to calc the row/col based on each items start date. Each date box has a Date() property.
	//	And, if an item overlaps rows, then you need to add a 2nd item on the subsequent row.

	function setItemsByDay() {
		const daysWithEvents: string[] = []
		items.forEach((item) => {
			const date = dayjs(item.event.startAt).format('YYYY-MM-DD')
			if (!daysWithEvents.includes(date)) {
				daysWithEvents.push(date)
			}
		})
		let values: Record<string, CalendarEventItem[]> = {}
		daysWithEvents.forEach((date) => {
			const existing = days.find((d) => date === dayjs(d.date).format('YYYY-MM-DD'))
			if (existing) {
				values[date] = items.filter(
					(item) => dayjs(item.event.startAt).format('YYYY-MM-DD') === date
				)
			}
		})
		return values
	}

	function initMonthItems() {
		itemsByDay = setItemsByDay()
		//This is where you calc the row/col to put each dated item
		for (let i of items) {
			let rc = findRowCol(i.startAt)
			if (rc == null) {
				i.startCol = i.startRow = 0
			} else {
				i.startCol = rc.col
				i.startRow = rc.row
			}
		}
	}

	// choose what date/day gets displayed in each date box.
	function initContent() {
		initMonth()
		initMonthItems()
	}
	function initMonth() {
		days = []
		let monthAbbrev = monthNames[month]?.slice(0, 3)
		let nextMonthAbbrev = monthNames[(month + 1) % 12]?.slice(0, 3)
		//	find the last Monday of the previous month
		let firstDay = new Date(year, month, 1).getDay()
		let daysInThisMonth = new Date(year, month + 1, 0).getDate()
		let daysInLastMonth = new Date(year, month, 0).getDate()
		let prevMonth = month == 0 ? 11 : month - 1

		//	show the days before the start of this month (disabled) - always less than 7
		for (let i = daysInLastMonth - firstDay; i < daysInLastMonth; i++) {
			let d = new Date(prevMonth == 11 ? year - 1 : year, prevMonth, i + 1)
			days.push({ name: '' + (i + 1), enabled: false, date: d })
		}
		//	show the days in this month (enabled) - always 28 - 31
		for (let i = 0; i < daysInThisMonth; i++) {
			let d = new Date(year, month, i + 1)
			if (i == 0) days.push({ name: monthAbbrev + ' ' + (i + 1), enabled: true, date: d })
			else days.push({ name: '' + (i + 1), enabled: true, date: d })
		}
		//	show any days to fill up the last row (disabled) - always less than 7
		for (let i = 0; days.length % 7; i++) {
			let d = new Date(month == 11 ? year + 1 : year, (month + 1) % 12, i + 1)
			if (i == 0)
				days.push({
					name: nextMonthAbbrev + ' ' + (i + 1),
					enabled: false,
					date: d
				})
			else days.push({ name: '' + (i + 1), enabled: false, date: d })
		}
	}

	function findRowCol(dt: Date) {
		for (let i = 0; i < days.length; i++) {
			let d = days[i]?.date
			if (
				d &&
				d.getFullYear() === dt.getFullYear() &&
				d.getMonth() === dt.getMonth() &&
				d.getDate() === dt.getDate()
			)
				return { row: Math.floor(i / 7) + 2, col: (i % 7) + 1 }
		}
		return null
	}

	function itemClick(item: CalendarEventItem) {
		dispatch('itemClick', item)
	}
	function dayClick(day: CalendarDay) {
		dispatch('dayClick', day)
	}
	function next() {
		month++
		if (month == 12) {
			year++
			month = 0
		}
	}
	function prev() {
		if (month == 0) {
			month = 11
			year--
		} else {
			month--
		}
	}
	function isToday(value: Date) {
		return dayjs().format('YYYY-MM-DD') === dayjs(value).format('YYYY-MM-DD')
	}
	function handleClickToday() {
		year = now.getFullYear()
		month = now.getMonth()
	}
</script>

<div class={`${className} m-auto bg-white overflow-hidden `}>
	<div
		class="relative w-full py-4 flex items-center justify-between h-14 border-b border-slate-700"
	>
		{#if !isThisMonth}
			<button
				class="absolute ml-4 text-gray-900/80 bg-slate-100 px-3 py-1.5 rounded-lg text-xs"
				on:click={handleClickToday}
			>
				Back to Today
			</button>
		{/if}
		<div class="w-full py-4 flex items-center justify-center">
			<button
				on:click={() => prev()}
				class="px-1.5 py-1 rounded-md text-slate-700 bg-gray-400 hover:text-gray-800 hover:bg-gray-500 transition-all flex justify-center items-center"
			>
				<HeroIcon src={ChevronLeft} class="w-4 h-4 stroke-[3px]" />
			</button>
			<div class="w-60 text-sm flex font-semibold items-center justify-center">
				{monthNames[month]}
				{year}
			</div>
			<button
				on:click={() => next()}
				class="px-1.5 py-1 rounded-md text-slate-700 bg-gray-400 hover:text-gray-800 hover:bg-gray-500 transitin-all flex justify-center items-center"
			>
				<HeroIcon src={ChevronRight} class="w-4 h-4 stroke-[3px] relative left-[1px]" />
			</button>
		</div>
	</div>
	<div
		class="calendar grid grid grid-cols-[repeat(7,minmax(120px,1fr))] grid-rows-[40px] auto-rows-[120px]"
	>
		{#each headers as header}
			<span
				class="text-xs uppercase text-gray-900 text-center leading-[40px] border-b border-gray-600 font-medium"
			>
				{header}
			</span>
		{/each}

		{#each days as day}
			{#if day.enabled}
				<span class="day" class:today={isToday(day.date)} on:mousedown={(e) => dayClick(day)}>
					{day.name}
				</span>
			{:else}
				<span class="day day-disabled" on:mousedown={() => dispatch('dayClick', day)}
					>{day.name}</span
				>
			{/if}
		{/each}

		{#each Object.keys(itemsByDay) as date (date)}
			{@const itemsOnDay = itemsByDay[date]}
			{#if itemsOnDay && itemsOnDay.length > 0}
				{@const firstItem = itemsOnDay[0]}
				{#if firstItem}
					<section
						class={`z-10 h-full mx-2 flex justify-end flex-col ${
							itemsOnDay.length > 1 ? 'pb-2' : 'pb-8'
						}`}
						style="grid-column: {firstItem.startCol} / span 1;      
            grid-row: {firstItem.startRow};  
            "
					>
						<Carousel>
							{#each itemsOnDay as item (item.event.id)}
								<button
									class="flex flex-col justify-end cursor-pointer text-left"
									on:click={(e) => itemClick(item)}
								>
									<svelte:component this={contentComponent} event={item.event} />
								</button>
							{/each}
						</Carousel>
					</section>
				{/if}
			{/if}
		{/each}
	</div>
</div>

<style lang="postcss">
	.day {
		@apply px-3 py-2 bg-slate-200 border-b border-r border-gray-600 text-xs  text-gray-800;
	}
	.day.today {
		@apply bg-yellow-100;
	}
	.day-disabled {
		@apply bg-white cursor-not-allowed text-gray-700;
	}
	.day:nth-of-type(7n + 7) {
		border-right: 0;
	}
	.day:nth-of-type(n + 1):nth-of-type(-n + 7) {
		grid-row: 1;
	}
	.day:nth-of-type(n + 8):nth-of-type(-n + 14) {
		grid-row: 2;
	}
	.day:nth-of-type(n + 15):nth-of-type(-n + 21) {
		grid-row: 3;
	}
	.day:nth-of-type(n + 22):nth-of-type(-n + 28) {
		grid-row: 4;
	}
	.day:nth-of-type(n + 29):nth-of-type(-n + 35) {
		grid-row: 5;
	}
	.day:nth-of-type(n + 36):nth-of-type(-n + 42) {
		grid-row: 6;
	}
	.day:nth-of-type(n + 43):nth-of-type(-n + 49) {
		grid-row: 7;
	}
	.day:nth-of-type(7n + 1) {
		grid-column: 1/1;
	}
	.day:nth-of-type(7n + 2) {
		grid-column: 2/2;
	}
	.day:nth-of-type(7n + 3) {
		grid-column: 3/3;
	}
	.day:nth-of-type(7n + 4) {
		grid-column: 4/4;
	}
	.day:nth-of-type(7n + 5) {
		grid-column: 5/5;
	}
	.day:nth-of-type(7n + 6) {
		grid-column: 6/6;
	}
	.day:nth-of-type(7n + 7) {
		grid-column: 7/7;
	}
</style>
