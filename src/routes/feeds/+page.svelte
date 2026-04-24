<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { feedsState } from '$lib/feeds/state.svelte.js';
	import FeedAdvanceCalculator from '$lib/feeds/FeedAdvanceCalculator.svelte';
	import FeedAdvanceInputs from '$lib/feeds/FeedAdvanceInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import { Baby } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'feeds',
			accentColor: 'var(--color-identity)'
		});
		feedsState.init();
	});

	// Drawer expanded state — mobile-only affordance, drives the bottom-sheet <dialog>.
	let drawerExpanded = $state(false);

	// One-line summary for the drawer handle. Tracks live state so a clinician can
	// confirm what's loaded (mode + weight) without expanding the drawer.
	const drawerSummary = $derived.by(() => {
		const w = feedsState.current.weightKg;
		const wStr = w === null ? '·' : `${w}`;
		const mode = feedsState.current.mode === 'bedside' ? 'Bedside' : 'Full Nutrition';
		return `Mode: ${mode} · Weight ${wStr} kg`;
	});
</script>

<svelte:head>
	<title>Feeds | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Mobile (<md): single column. Hero (Goal ml/feed | Total kcal/kg/d) + per-mode
  output breakdown sit in the scroll region; the InputDrawer pins above the
  bottom nav (Plan 1's safe-area clearance is preserved by main's pb-[calc(...)]
  in +layout.svelte).

  Desktop (md+): two-column grid. Hero+outputs on the left ~60%; inputs card
  sticks to the top of the right ~40% column as the user scrolls. The mobile
  drawer handle is hidden via md:hidden inside InputDrawer itself.

  IMPORTANT (per orchestrator): Plan 42.1-06 moved the SegmentedToggle (Bedside /
  Full Nutrition) INTO the inputs card. The drawer therefore contains weight +
  mode-toggle + per-mode inputs as a single source of truth across both the
  mobile drawer and the desktop sidebar. The toggle does NOT live in the route.
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

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + per-mode output breakdown column -->
			<div class="min-w-0">
				<FeedAdvanceCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile (<md) hides this; the
			     <InputDrawer> below is the mobile entry point. -->
			<aside class="hidden md:block" aria-label="Feeds inputs">
				<div class="sticky top-20">
					<FeedAdvanceInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: handle pins above the bottom nav, sheet expands on tap. -->
<InputDrawer summary={drawerSummary} title="Feeds inputs" bind:expanded={drawerExpanded}>
	{#snippet children()}
		<FeedAdvanceInputs />
	{/snippet}
</InputDrawer>
