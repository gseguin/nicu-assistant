<!--
  src/lib/morphine/MorphineWeanInputs.svelte

  Inputs-only fragment extracted from MorphineWeanCalculator (Plan 42.1-05 / D-08).
  The route composes this either inside the desktop sticky right column or inside the
  mobile <InputDrawer>. The calculator itself owns the hero + schedule.

  No own state — all values flow through the morphineState singleton, identical to
  the previous inline inputs section.
-->
<script lang="ts">
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import config from '$lib/morphine/morphine-config.json';
	import type { MorphineInputRanges } from '$lib/morphine/types.js';

	const inputs = config.inputs as MorphineInputRanges;

	// Persist on every change — duplicates the calculator's effect so the inputs work
	// independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(morphineState.current);
		morphineState.persist();
	});

	let hasValues = $derived(
		morphineState.current.weightKg !== null ||
			morphineState.current.maxDoseMgKgDose !== null ||
			morphineState.current.decreasePct !== null
	);

	function clearInputs() {
		morphineState.reset();
	}
</script>

<section class="card flex flex-col gap-4">
	<NumericInput
		bind:value={morphineState.current.weightKg}
		label="Dosing weight"
		suffix="kg"
		min={inputs.weightKg.min}
		max={inputs.weightKg.max}
		step={inputs.weightKg.step}
		placeholder="3.1"
		id="morphine-weight"
	/>
	<NumericInput
		bind:value={morphineState.current.maxDoseMgKgDose}
		label="Max morphine dose"
		suffix="mg/kg/dose"
		min={inputs.maxDoseMgKgDose.min}
		max={inputs.maxDoseMgKgDose.max}
		step={inputs.maxDoseMgKgDose.step}
		placeholder="0.04"
		id="morphine-max-dose"
	/>
	<NumericInput
		bind:value={morphineState.current.decreasePct}
		label="Decrease per step"
		suffix="%"
		min={inputs.decreasePct.min}
		max={inputs.decreasePct.max}
		step={inputs.decreasePct.step}
		placeholder="10"
		id="morphine-decrease"
	/>

	{#if hasValues}
		<div class="flex justify-center">
			<button
				type="button"
				onclick={clearInputs}
				class="min-h-[36px] rounded-lg px-3 py-1.5 text-2xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
			>
				Clear inputs
			</button>
		</div>
	{/if}
</section>
