<!--
  src/lib/gir/GirInputs.svelte

  Inputs-only fragment extracted from GirCalculator (Plan 42.1-05 / D-08).
  The route composes this either inside the desktop sticky right column or inside the
  mobile <InputDrawer>. The calculator itself owns the hero + advisories + titration grid.

  No own state — all values flow through the girState singleton, identical to the
  previous inline inputs section. The Dextrose >12.5% advisory note is co-located
  with the Dextrose input (it is a property of THAT field, not the result), so it
  travels with the input wherever the drawer renders.
-->
<script lang="ts">
	import RangedNumericInput from '$lib/shared/components/RangedNumericInput.svelte';
	import { girState } from '$lib/gir/state.svelte.js';
	import config from '$lib/gir/gir-config.json';
	import type { GirInputRanges } from '$lib/gir/types.js';
	import { AlertTriangle } from '@lucide/svelte';

	const inputs = config.inputs as GirInputRanges;

	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(girState.current);
		girState.persist();
	});

	let showDexAdvisory = $derived(
		girState.current.dextrosePct != null && girState.current.dextrosePct > 12.5
	);
</script>

<section class="card flex flex-col gap-4">
	<RangedNumericInput
		bind:value={girState.current.weightKg}
		label="Weight"
		suffix="kg"
		min={inputs.weightKg.min}
		max={inputs.weightKg.max}
		step={inputs.weightKg.step}
		typeStep={0.01}
		placeholder="3.0"
		id="gir-weight"
		showRangeHint={true}
		showRangeError={true}
	/>
	<RangedNumericInput
		bind:value={girState.current.dextrosePct}
		label="Dextrose"
		suffix="%"
		min={inputs.dextrosePct.min}
		max={inputs.dextrosePct.max}
		step={inputs.dextrosePct.step}
		placeholder="12.5"
		id="gir-dextrose"
		showRangeHint={true}
		showRangeError={true}
	/>

	{#if showDexAdvisory}
		<div
			class="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3"
			role="note"
		>
			<AlertTriangle
				size={20}
				class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
				aria-hidden="true"
			/>
			<p class="text-base font-semibold text-[var(--color-text-primary)]">
				Dextrose &gt;12.5% requires central venous access
			</p>
		</div>
	{/if}

	<RangedNumericInput
		bind:value={girState.current.mlPerKgPerDay}
		label="Fluid order"
		suffix="ml/kg/day"
		min={inputs.mlPerKgPerDay.min}
		max={inputs.mlPerKgPerDay.max}
		step={inputs.mlPerKgPerDay.step}
		placeholder="80"
		id="gir-fluid"
		showRangeHint={true}
		showRangeError={true}
	/>
</section>
