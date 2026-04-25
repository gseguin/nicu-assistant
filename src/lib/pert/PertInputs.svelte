<!--
  src/lib/pert/PertInputs.svelte

  Inputs-only fragment for the PERT calculator. Mirrors the structural shape of
  src/lib/feeds/FeedAdvanceInputs.svelte (mode toggle + per-mode {#if} blocks +
  shared inputs + persist $effect). Composed by +page.svelte once in the desktop
  sticky right column and once inside the mobile <InputDrawer>; both instances
  bind to the SAME `pertState` singleton; no per-instance state.

  Decisions implemented:
    - D-06 + D-07: SegmentedToggle bound to pertState.current.mode; mode persists
      via the $effect persist hook below (defensive duplicate of the calculator's
      hook so inputs work standalone in the drawer).
    - D-08: Per-mode required input set rendered (mode-conditional {#if} blocks).
    - D-11: Medication change resets `strengthValue` to null.
    - D-13: Volume in mL, step 10, suffix "mL".
    - D-14: showRangeHint + showRangeError stay at NumericInput defaults (true).
    - D-17: UI labels for the lipase-rate inputs reflect fat-based dosing
      per xlsx parity; JSON keys (oral.lipasePerKgPerMeal,
      tubeFeed.lipasePerKgPerDay) UNCHANGED to keep the Phase-1-frozen state
      schema intact.

  No imports from ./calculations. Pure inputs surface, calc-layer separation
  per CONTEXT D-01.
-->
<script lang="ts">
	import { pertState } from './state.svelte.js';
	import { inputs, medications, formulas, getStrengthsForMedication } from './config.js';
	import type { PertMode } from './types.js';
	import type { SelectOption } from '$lib/shared/types.js';
	import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
	import RangedNumericInput from '$lib/shared/components/RangedNumericInput.svelte';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import SelectPicker from '$lib/shared/components/SelectPicker.svelte';

	// Persist on every state change. Defensive duplicate of PertCalculator's own
	// $effect so the inputs work standalone when mounted only inside the mobile
	// <InputDrawer>. Mirrors the FeedAdvanceInputs pattern exactly.
	$effect(() => {
		JSON.stringify(pertState.current);
		pertState.persist();
	});

	// Mode toggle options (D-06).
	const modeOptions: { value: PertMode; label: string }[] = [
		{ value: 'oral', label: 'Oral' },
		{ value: 'tube-feed', label: 'Tube-Feed' }
	];

	// Medication SelectPicker options (5 brands after fdaAllowlist filter in config.ts).
	const medicationOptions: SelectOption[] = medications.map((m) => ({
		value: m.id,
		label: m.brand
	}));

	// Formula SelectPicker options (17 entries from config; search-enabled).
	const formulaOptions: SelectOption[] = formulas.map((f) => ({
		value: f.id,
		label: f.name
	}));

	// Strength SelectPicker options derived from selected medication (PERT-ORAL-05 /
	// PERT-TUBE-05). en-US locale formatting per UI-SPEC: "12,000 units". Empty
	// array when no medication is selected; Strength picker shows placeholder.
	let strengthOptions: SelectOption[] = $derived(
		pertState.current.medicationId
			? getStrengthsForMedication(pertState.current.medicationId).map((s) => ({
					value: String(s),
					label: `${s.toLocaleString('en-US')} units`
				}))
			: []
	);

	// String-bridge proxies for the three SelectPickers. SelectPicker.value is
	// $bindable<string>, but our state holds (string | null) for medication/formula
	// and (number | null) for strength. We CANNOT use `as string` casts inside
	// bind:value: Svelte 5's writable-lvalue requirement rejects that. The
	// canonical pattern (mirrors src/lib/feeds/FeedAdvanceInputs.svelte:55-74)
	// is a $state proxy + a read-direction $effect (state -> string) + a
	// write-direction $effect (string -> state).

	// medicationId <-> medicationIdStr
	let medicationIdStr = $state<string>(pertState.current.medicationId ?? '');
	$effect(() => {
		const next = pertState.current.medicationId ?? '';
		if (next !== medicationIdStr) {
			medicationIdStr = next;
		}
	});
	$effect(() => {
		const next = medicationIdStr === '' ? null : medicationIdStr;
		if (next !== pertState.current.medicationId) {
			pertState.current.medicationId = next;
		}
	});

	// strengthValue <-> strengthStr
	let strengthStr = $state<string>(
		pertState.current.strengthValue === null ? '' : String(pertState.current.strengthValue)
	);
	$effect(() => {
		const next =
			pertState.current.strengthValue === null ? '' : String(pertState.current.strengthValue);
		if (next !== strengthStr) {
			strengthStr = next;
		}
	});
	$effect(() => {
		if (strengthStr === '') {
			if (pertState.current.strengthValue !== null) {
				pertState.current.strengthValue = null;
			}
			return;
		}
		const parsed = parseInt(strengthStr, 10);
		if (Number.isFinite(parsed) && parsed !== pertState.current.strengthValue) {
			pertState.current.strengthValue = parsed;
		}
	});

	// formulaId <-> formulaIdStr
	let formulaIdStr = $state<string>(pertState.current.tubeFeed.formulaId ?? '');
	$effect(() => {
		const next = pertState.current.tubeFeed.formulaId ?? '';
		if (next !== formulaIdStr) {
			formulaIdStr = next;
		}
	});
	$effect(() => {
		const next = formulaIdStr === '' ? null : formulaIdStr;
		if (next !== pertState.current.tubeFeed.formulaId) {
			pertState.current.tubeFeed.formulaId = next;
		}
	});

	// D-11: medication change resets strengthValue to null. Track last seen
	// medicationId; on change, force-clear strengthValue (which propagates through
	// the strengthStr $effect above to clear the SelectPicker).
	let lastMedId = $state<string | null>(pertState.current.medicationId);
	$effect(() => {
		const cur = pertState.current.medicationId;
		if (cur !== lastMedId) {
			lastMedId = cur;
			// Stale strength from a previous medication is invalid clinically; clear it.
			pertState.current.strengthValue = null;
		}
	});
</script>

<div class="space-y-6">
	<!-- SHARED CARD: Mode toggle + Weight (always visible across both modes per D-08;
	     Weight is the patient anchor input that reads first). -->
	<section class="card flex flex-col gap-4 px-5 py-5">
		<SegmentedToggle
			label="Calculator mode"
			bind:value={pertState.current.mode}
			options={modeOptions}
			ariaLabel="PERT mode"
		/>
		<RangedNumericInput
			bind:value={pertState.current.weightKg}
			label="Weight"
			suffix="kg"
			min={inputs.weightKg.min}
			max={inputs.weightKg.max}
			step={inputs.weightKg.step}
			typeStep={0.01}
			placeholder="3.0"
			id="pert-weight"
			sliderAriaLabel="Weight slider"
		/>
	</section>

	{#if pertState.current.mode === 'oral'}
		<!-- ORAL-MODE INPUTS: fat per meal + lipase rate (D-15 + D-17) -->
		<section class="card flex flex-col gap-3 px-5 py-5">
			<NumericInput
				bind:value={pertState.current.oral.fatGrams}
				label="Fat per meal"
				suffix="g"
				min={inputs.fatGrams.min}
				max={inputs.fatGrams.max}
				step={inputs.fatGrams.step}
				placeholder="25"
				id="pert-fat-grams"
			/>
			<NumericInput
				bind:value={pertState.current.oral.lipasePerKgPerMeal}
				label="Lipase per gram of fat"
				suffix="units/g"
				min={inputs.lipasePerKgPerMeal.min}
				max={inputs.lipasePerKgPerMeal.max}
				step={inputs.lipasePerKgPerMeal.step}
				placeholder="1000"
				id="pert-oral-lipase-rate"
			/>
		</section>
	{:else}
		<!-- TUBE-FEED INPUTS: formula + volume + lipase rate (D-16 + D-17) -->
		<section class="card flex flex-col gap-3 px-5 py-5">
			<SelectPicker
				label="Formula"
				bind:value={formulaIdStr}
				options={formulaOptions}
				searchable={true}
				placeholder="Select formula"
			/>
			<NumericInput
				bind:value={pertState.current.tubeFeed.volumePerDayMl}
				label="Volume per day"
				suffix="mL"
				min={inputs.volumePerDayMl.min}
				max={inputs.volumePerDayMl.max}
				step={inputs.volumePerDayMl.step}
				placeholder="1000"
				id="pert-volume"
			/>
			<NumericInput
				bind:value={pertState.current.tubeFeed.lipasePerKgPerDay}
				label="Lipase per gram of fat"
				suffix="units/g"
				min={inputs.lipasePerKgPerDay.min}
				max={inputs.lipasePerKgPerDay.max}
				step={inputs.lipasePerKgPerDay.step}
				placeholder="1000"
				id="pert-tube-lipase-rate"
			/>
		</section>
	{/if}

	<!-- SHARED CARD: Medication + Strength (D-08; both modes need these) -->
	<section class="card flex flex-col gap-3 px-5 py-5">
		<SelectPicker
			label="Medication"
			bind:value={medicationIdStr}
			options={medicationOptions}
			placeholder="Select medication"
		/>
		<SelectPicker
			label="Strength"
			bind:value={strengthStr}
			options={strengthOptions}
			placeholder={pertState.current.medicationId
				? 'Select strength'
				: 'Choose medication first'}
		/>
	</section>
</div>
