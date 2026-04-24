<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import MorphineWeanCalculator from '$lib/morphine/MorphineWeanCalculator.svelte';
	import MorphineWeanInputs from '$lib/morphine/MorphineWeanInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap, { type RecapItem } from '$lib/shared/components/InputsRecap.svelte';
	import { Syringe } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'morphine-wean',
			accentColor: 'var(--color-accent)'
		});
		morphineState.init();
	});

	// Drawer expanded state — mobile-only affordance, driven by InputsRecap tap.
	let drawerExpanded = $state(false);

	// Recap items render below the title and above the hero.
	// Three drivers of the schedule: weight, max dose, step size.
	const recapItems = $derived.by<RecapItem[]>(() => {
		const s = morphineState.current;
		return [
			{
				label: 'Weight',
				value: s.weightKg === null ? null : `${s.weightKg}`,
				unit: 'kg',
				fullRow: true
			},
			{
				label: 'Max dose',
				value: s.maxDoseMgKgDose === null ? null : `${s.maxDoseMgKgDose}`,
				unit: 'mg/kg'
			},
			{ label: 'Step', value: s.decreasePct === null ? null : `${s.decreasePct}`, unit: '%' }
		];
	});
</script>

<svelte:head>
	<title>Morphine Wean | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Reading order below the title: InputsRecap (metadata strip) → HeroResult → schedule.
  The recap tells the clinician what the result depends on before they read the result.
  Tapping the recap on mobile opens InputDrawer; desktop shows the sticky right column.
-->
<div class="identity-morphine">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Syringe size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
			<h1 class="text-title font-bold text-[var(--color-text-primary)]">Morphine Wean</h1>
		</header>

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={morphineState.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + schedule column -->
			<div class="min-w-0">
				<MorphineWeanCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile opens the drawer via InputsRecap. -->
			<aside class="hidden md:block" aria-label="Morphine inputs">
				<div class="sticky top-20">
					<MorphineWeanInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: opened by InputsRecap above. -->
<InputDrawer
	title="Morphine inputs"
	bind:expanded={drawerExpanded}
	onClear={() => morphineState.reset()}
>
	{#snippet children()}
		<MorphineWeanInputs />
	{/snippet}
</InputDrawer>
