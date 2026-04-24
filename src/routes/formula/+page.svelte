<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import { getFormulaById } from '$lib/fortification/fortification-config.js';
	import FortificationCalculator from '$lib/fortification/FortificationCalculator.svelte';
	import FortificationInputs from '$lib/fortification/FortificationInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import { Milk } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'formula',
			accentColor: 'var(--color-accent)'
		});
		fortificationState.init();
	});

	// Drawer expanded state — mobile-only affordance, drives the bottom-sheet <dialog>.
	let drawerExpanded = $state(false);

	// One-line summary for the drawer handle. Tracks live state so a clinician can
	// confirm what's loaded without expanding the drawer. Shows formula name + volume +
	// target kcal — the three values most likely to differ between recipes.
	const drawerSummary = $derived.by(() => {
		const s = fortificationState.current;
		const formula = getFormulaById(s.formulaId);
		const formulaName = formula?.name ?? '—';
		const volStr = s.volumeMl === null ? '—' : `${s.volumeMl}`;
		return `${formulaName} · ${volStr} mL · ${s.targetKcalOz} kcal/oz`;
	});
</script>

<svelte:head>
	<title>Formula Recipe | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Mobile (<md): single column. Hero card sits at top of the page; verification card
  below; the InputDrawer pins above the bottom nav (Plan 1's safe-area clearance is
  preserved by main's pb-[calc(...)] in +layout.svelte).

  Desktop (md+): two-column grid. Hero+verification on the left ~60%; inputs card
  sticks to the top of the right ~40% column as the user scrolls. The mobile drawer
  handle is hidden via md:hidden inside InputDrawer itself.

  Defaults pre-computed via fortificationState (Neocate Infant, 180 mL, 24 kcal/oz)
  so the hero shows a real number on first paint per D-08 acceptance.
-->
<div class="identity-formula">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Milk size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
			<h1 class="text-title font-bold text-[var(--color-text-primary)]">Formula Recipe</h1>
		</header>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + verification column -->
			<div class="min-w-0">
				<FortificationCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile (<md) hides this; the
			     <InputDrawer> below is the mobile entry point. -->
			<aside class="hidden md:block" aria-label="Formula inputs">
				<div class="sticky top-20">
					<FortificationInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: handle pins above the bottom nav, sheet expands on tap. -->
<InputDrawer summary={drawerSummary} title="Formula inputs" bind:expanded={drawerExpanded}>
	{#snippet children()}
		<FortificationInputs />
	{/snippet}
</InputDrawer>
