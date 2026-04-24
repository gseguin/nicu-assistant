<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import MorphineWeanCalculator from '$lib/morphine/MorphineWeanCalculator.svelte';
	import MorphineWeanInputs from '$lib/morphine/MorphineWeanInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import { Syringe } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'morphine-wean',
			accentColor: 'var(--color-accent)'
		});
		morphineState.init();
	});

	// Drawer expanded state — mobile-only affordance, drives the bottom-sheet <dialog>.
	let drawerExpanded = $state(false);

	// One-line summary for the drawer handle. Tracks live state so a clinician can
	// confirm what's loaded without expanding the drawer.
	const drawerSummary = $derived.by(() => {
		const w = morphineState.current.weightKg;
		const d = morphineState.current.decreasePct;
		const wStr = w === null ? '—' : `${w}`;
		const dStr = d === null ? '—' : `${d}%`;
		return `Weight ${wStr} kg · ${dStr} step`;
	});
</script>

<svelte:head>
	<title>Morphine Wean | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Mobile (<md): single column. Hero card sits at top of the page; schedule scrolls
  below; the InputDrawer pins above the bottom nav (Plan 1's safe-area clearance is
  preserved by main's pb-[calc(...)] in +layout.svelte).

  Desktop (md+): two-column grid. Hero+schedule on the left ~60%; inputs card sticks
  to the top of the right ~40% column as the user scrolls. The mobile drawer handle
  is hidden via md:hidden inside InputDrawer itself.

  Defaults pre-computed via morphineState (weight=3.1, max-dose=0.04, step=10%) —
  the hero shows a real number on first paint per D-08 acceptance.
-->
<div class="identity-morphine">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Syringe size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
			<h1 class="text-title font-bold text-[var(--color-text-primary)]">Morphine Wean</h1>
		</header>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + schedule column -->
			<div class="min-w-0">
				<MorphineWeanCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile (<md) hides this; the
			     <InputDrawer> below is the mobile entry point. -->
			<aside
				class="hidden md:block"
				aria-label="Morphine inputs"
			>
				<div class="sticky top-20">
					<MorphineWeanInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: handle pins above the bottom nav, sheet expands on tap. -->
<InputDrawer summary={drawerSummary} title="Morphine inputs" bind:expanded={drawerExpanded}>
	{#snippet children()}
		<MorphineWeanInputs />
	{/snippet}
</InputDrawer>
