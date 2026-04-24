<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { girState } from '$lib/gir/state.svelte.js';
	import GirCalculator from '$lib/gir/GirCalculator.svelte';
	import GirInputs from '$lib/gir/GirInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap, { type RecapItem } from '$lib/shared/components/InputsRecap.svelte';
	import { Droplet } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'gir',
			accentColor: 'var(--color-identity)'
		});
		girState.init();
	});

	// Drawer expanded state — mobile-only affordance, driven by InputsRecap tap.
	let drawerExpanded = $state(false);

	const recapItems = $derived.by<RecapItem[]>(() => {
		const s = girState.current;
		return [
			{
				label: 'Weight',
				value: s.weightKg === null ? null : `${s.weightKg}`,
				unit: 'kg',
				fullRow: true
			},
			{
				label: 'Dextrose',
				value: s.dextrosePct === null ? null : `${s.dextrosePct}`,
				unit: '%'
			},
			{
				label: 'Fluid rate',
				value: s.mlPerKgPerDay === null ? null : `${s.mlPerKgPerDay}`,
				unit: 'mL/kg/d'
			}
		];
	});
</script>

<svelte:head>
	<title>GIR | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Reading order below the title: InputsRecap → hero + advisories + titration grid.
  The titration grid stays BELOW the hero — only the 3 inputs (Weight, Dextrose,
  Fluid) live in the drawer. Tapping the recap on mobile opens the drawer.
-->
<div class="identity-gir">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Droplet size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
			<div class="flex flex-col">
				<h1 class="text-title font-bold text-[var(--color-text-primary)]">Glucose Infusion Rate</h1>
				<span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min · titration helper</span>
			</div>
		</header>

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={girState.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + advisories + titration grid column -->
			<div class="min-w-0">
				<GirCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile opens the drawer via InputsRecap. -->
			<aside class="hidden md:block" aria-label="GIR inputs">
				<div class="sticky top-20">
					<GirInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: opened by InputsRecap above. -->
<InputDrawer
	title="GIR inputs"
	bind:expanded={drawerExpanded}
	onClear={() => girState.reset()}
>
	{#snippet children()}
		<GirInputs />
	{/snippet}
</InputDrawer>
