<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getMeContext } from '$lib/state/getContexts'

const me = getMeContext()
</script>

<Screen title="Meals" bigTitle="Meals">
	<div class="mx-auto px-6 pt-2 md:max-w-7xl">
		<div class="pb-12 text-slate-600">
			<div class="mb-3 mt-5 pr-6 text-2xl font-semibold text-slate-600/70">
				Here's what to expect if you're hungry
			</div>
			<div class="mb-1 mt-10 text-xl font-semibold">Deluxe Continental Breakfast</div>
			<ul>
				<li>Seasonal fruit salad</li>
				<li>Assorted Individual Yogurts with Granola</li>
				<li>Bakery Basket including Danish Pastries, Croissants, and Muffins</li>
				<li>Sweet Butter, Honey, and Preserves</li>
				<li>Freshly Brewed Coffees, Teas, and Iced Water</li>
			</ul>

			<div class="mb-1 mt-10 text-xl font-semibold">Morning Snack Break</div>
			<ul>
				<li>
					Hot Beverages: Freshly Brewed Wildcat Regular and Decaf Coffee, Hot Water with Tazo Teas
				</li>
				<li>Whole Fresh Fruit</li>
				<li>Tea Cookies</li>
				<li>Southwestern Trail Mix</li>
			</ul>

			<div class="mb-1 mt-10 text-xl font-semibold">Lunch Buffet</div>
			<div class="mb-1 mt-4 text-base font-semibold">Salads</div>
			<ul>
				<li>
					Iceberg Wedge and Romaine Hearts with Candied Nuts (on the side), Bleu Cheese Crumbles,
					and Creamy Bleu Cheese Dressing
				</li>
				<li>Tomato and Cucumber Salad with Red Onions and Cider Vinegar</li>
			</ul>
			<div class="mb-1 mt-4 text-base font-semibold">Entrees</div>
			<ul>
				<li>Country Style Meatloaf with Onions and Mushrooms</li>
				<li>Sliced Roasted Porkloin with Cheddar Cheese Grits, Roasted Apples, and Apple Demi</li>
			</ul>

			<div class="mb-1 mt-4 text-base font-semibold">Accompaniments</div>
			<ul>
				<li>Macaroni and Cheese</li>
				<li>Chef's Choice Seasonal Vegetable</li>
				<li>Hearth Baked Breads and Butter</li>
			</ul>
			<div class="mb-1 mt-4 text-base font-semibold">Desserts</div>
			<ul>
				<li>Carrot Cake Diamonds with Cream Cheese Icing</li>
				<li>Apple Cranberry White Cheddar Cobbler</li>
				<li>Fresh Fruit</li>
			</ul>

			<div class="mb-1 mt-4 text-base font-semibold">Drinks</div>
			<ul class="mb-8">
				<li>Iced Water, Iced Tea, and Lemonade</li>
			</ul>
		</div>
	</div>
</Screen>

<style lang="postcss">
ul {
	@apply ml-4 pl-0.5;
}
li {
	@apply mb-1.5 list-disc;
}
</style>
