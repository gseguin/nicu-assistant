<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import { getFormulaById } from '$lib/fortification/fortification-config.js';
	import FortificationCalculator from '$lib/fortification/FortificationCalculator.svelte';
	import FortificationInputs from '$lib/fortification/FortificationInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap, { type RecapItem } from '$lib/shared/components/InputsRecap.svelte';
	import { Milk } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'formula',
			accentColor: 'var(--color-accent)'
		});
		fortificationState.init();
	});

	// Drawer expanded state — mobile-only affordance, driven by InputsRecap tap.
	let drawerExpanded = $state(false);

	// Recap items: base, formula, volume, target. First item (formula name) gets flex:2
	// in InputsRecap to accommodate longer names like "Similac Special Care 30 w/ Iron".
	const recapItems = $derived.by<RecapItem[]>(() => {
		const s = fortificationState.current;
		const formula = getFormulaById(s.formulaId);
		return [
			{ label: 'Formula', value: formula?.name ?? null },
			{ label: 'Base', value: s.base === 'breast-milk' ? 'Breast milk' : 'Water' },
			{
				label: 'Volume',
				value: s.volumeMl === null ? null : `${s.volumeMl}`,
				unit: 'mL'
			},
			{ label: 'Target', value: `${s.targetKcalOz}`, unit: 'kcal/oz' }
		];
	});
</script>

<svelte:head>
	<title>Formula Recipe | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Reading order below the title: InputsRecap → hero + verification. Tapping the
  recap on mobile opens InputDrawer; desktop shows the sticky right column.
-->
<div class="identity-formula">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Milk size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
			<h1 class="text-title font-bold text-[var(--color-text-primary)]">Formula Recipe</h1>
		</header>

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={fortificationState.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + verification column -->
			<div class="min-w-0">
				<FortificationCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile opens the drawer via InputsRecap. -->
			<aside class="hidden md:block" aria-label="Formula inputs">
				<div class="sticky top-20">
					<FortificationInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: opened by InputsRecap above. -->
<InputDrawer
	title="Formula inputs"
	bind:expanded={drawerExpanded}
	onClear={() => fortificationState.reset()}
>
	{#snippet children()}
		<FortificationInputs />
	{/snippet}
</InputDrawer>
