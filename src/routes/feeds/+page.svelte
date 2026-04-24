<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { feedsState } from '$lib/feeds/state.svelte.js';
	import FeedAdvanceCalculator from '$lib/feeds/FeedAdvanceCalculator.svelte';
	import FeedAdvanceInputs from '$lib/feeds/FeedAdvanceInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap, { type RecapItem } from '$lib/shared/components/InputsRecap.svelte';
	import { Baby } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'feeds',
			accentColor: 'var(--color-identity)'
		});
		feedsState.init();
	});

	// Drawer expanded state — mobile-only affordance, driven by InputsRecap tap.
	let drawerExpanded = $state(false);

	// Feeds has the deepest drawer by input count (weight + mode-toggle + per-mode);
	// the recap surfaces the two top-level drivers (mode + weight), everything else
	// is a modifier that lives in the drawer.
	const recapItems = $derived.by<RecapItem[]>(() => {
		const s = feedsState.current;
		return [
			{
				label: 'Weight',
				value: s.weightKg === null ? null : `${s.weightKg}`,
				unit: 'kg',
				fullRow: true
			},
			{ label: 'Mode', value: s.mode === 'bedside' ? 'Bedside' : 'Full Nutrition' }
		];
	});
</script>

<svelte:head>
	<title>Feeds | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Reading order below the title: InputsRecap → hero + per-mode output breakdown.
  SegmentedToggle (Bedside / Full Nutrition) lives in the inputs card (Plan
  42.1-06), so weight + mode-toggle + per-mode inputs all come from a single
  source of truth across drawer + sidebar. Tapping the recap on mobile opens
  the drawer.
-->
<div class="identity-feeds">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Baby size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
			<div class="flex flex-col">
				<h1 class="text-title font-bold text-[var(--color-text-primary)]">
					Feed Advance Calculator
				</h1>
				<span class="text-ui text-[var(--color-text-secondary)]"
					>bedside volumes + nutrition totals</span
				>
			</div>
		</header>

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={feedsState.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + per-mode output breakdown column -->
			<div class="min-w-0">
				<FeedAdvanceCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile opens the drawer via InputsRecap. -->
			<aside class="hidden md:block" aria-label="Feeds inputs">
				<div class="sticky top-20">
					<FeedAdvanceInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: opened by InputsRecap above. -->
<InputDrawer
	title="Feeds inputs"
	bind:expanded={drawerExpanded}
	onClear={() => feedsState.reset()}
>
	{#snippet children()}
		<FeedAdvanceInputs />
	{/snippet}
</InputDrawer>
