<!--
  src/lib/feeds/FeedAdvanceInputs.svelte

  Inputs-only fragment extracted from FeedAdvanceCalculator (Plan 42.1-05 / D-08).
  The route composes this either inside the desktop sticky right column or inside the
  mobile <InputDrawer>. The calculator itself owns the result hero + advisories +
  per-mode output region.

  Composition (single source of truth across mobile drawer + desktop sidebar):
    1. Weight + mode-toggle (D-27 keeps the toggle INSIDE this same card so the
       primary control lives next to the primary input)
    2. Per-mode inputs:
       - Bedside: trophic / advance / goal / frequency / cadence / total fluids
       - Full nutrition: TPN line 1 / TPN line 2 / SMOF / enteral / kcal density

  No own state — values flow through the feedsState singleton, identical to the
  previous inline inputs section.
-->
<script lang="ts">
	import { feedsState } from './state.svelte.js';
	import {
		inputs,
		defaults,
		frequencyOptions,
		cadenceOptions
	} from './feeds-config.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import RangedNumericInput from '$lib/shared/components/RangedNumericInput.svelte';
	import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
	import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
	import type { SelectOption } from '$lib/shared/types.js';

	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(feedsState.current);
		feedsState.persist();
	});

	// SelectPicker option arrays
	let frequencySelectOptions: SelectOption[] = $derived(
		frequencyOptions.map((f) => ({ value: f.id, label: f.label }))
	);
	let cadenceSelectOptions: SelectOption[] = $derived(
		cadenceOptions.map((c) => ({ value: c.id, label: c.label }))
	);
	let kcalPerOzOptions: SelectOption[] = [
		{ value: '20', label: '20 kcal/oz' },
		{ value: '22', label: '22 kcal/oz' },
		{ value: '24', label: '24 kcal/oz' },
		{ value: '27', label: '27 kcal/oz' },
		{ value: '30', label: '30 kcal/oz' }
	];

	// String-to-number bridge for kcal/oz SelectPicker (bind:value requires $state)
	let kcalPerOzStr = $state(
		String(feedsState.current.enteralKcalPerOz ?? defaults.enteralKcalPerOz)
	);

	// Sync string -> number on SelectPicker change
	$effect(() => {
		const parsed = parseInt(kcalPerOzStr, 10);
		if (!isNaN(parsed) && parsed !== feedsState.current.enteralKcalPerOz) {
			feedsState.current.enteralKcalPerOz = parsed;
		}
	});

	// Sync number -> string when state changes externally (e.g. reset)
	$effect(() => {
		const current = String(feedsState.current.enteralKcalPerOz ?? defaults.enteralKcalPerOz);
		if (current !== kcalPerOzStr) {
			kcalPerOzStr = current;
		}
	});
</script>

<div class="space-y-6">
	<!-- SHARED: Weight input + mode toggle (D-27: toggle moved INTO the weight card so it's
	     always visible above the per-mode inputs card, not isolated between cards) -->
	<section class="card flex flex-col gap-4">
		<RangedNumericInput
			bind:value={feedsState.current.weightKg}
			label="Weight"
			suffix="kg"
			min={inputs.weightKg.min}
			max={inputs.weightKg.max}
			step={inputs.weightKg.step}
			placeholder="1.94"
			id="feeds-weight"
		/>
		<SegmentedToggle
			label="Calculator mode"
			bind:value={feedsState.current.mode}
			options={[
				{ value: 'bedside', label: 'Bedside Advancement' },
				{ value: 'full-nutrition', label: 'Full Nutrition' }
			]}
		/>
	</section>

	{#if feedsState.current.mode === 'bedside'}
		<!-- BEDSIDE INPUTS -->
		<section class="card flex flex-col gap-4">
			<RangedNumericInput
				bind:value={feedsState.current.trophicMlKgDay}
				label="Trophic"
				suffix="ml/kg/d"
				min={inputs.trophicMlKgDay.min}
				max={inputs.trophicMlKgDay.max}
				step={inputs.trophicMlKgDay.step}
				placeholder="20"
				id="feeds-trophic"
			/>
			<RangedNumericInput
				bind:value={feedsState.current.advanceMlKgDay}
				label="Advance"
				suffix="ml/kg/d"
				min={inputs.advanceMlKgDay.min}
				max={inputs.advanceMlKgDay.max}
				step={inputs.advanceMlKgDay.step}
				placeholder="30"
				id="feeds-advance"
			/>
			<RangedNumericInput
				bind:value={feedsState.current.goalMlKgDay}
				label="Goal"
				suffix="ml/kg/d"
				min={inputs.goalMlKgDay.min}
				max={inputs.goalMlKgDay.max}
				step={inputs.goalMlKgDay.step}
				placeholder="160"
				id="feeds-goal"
			/>
			<SelectPicker
				label="Feed frequency"
				bind:value={feedsState.current.trophicFrequency}
				options={frequencySelectOptions}
			/>
			<SelectPicker
				label="Advance cadence"
				bind:value={feedsState.current.advanceCadence}
				options={cadenceSelectOptions}
			/>
			<RangedNumericInput
				bind:value={feedsState.current.totalFluidsMlHr}
				label="Total fluids (for IV backfill)"
				suffix="ml/hr"
				min={inputs.totalFluidsMlHr.min}
				max={inputs.totalFluidsMlHr.max}
				step={inputs.totalFluidsMlHr.step}
				placeholder="12"
				id="feeds-total-fluids"
			/>
		</section>
	{:else}
		<!-- FULL NUTRITION INPUTS -->
		<section class="card flex flex-col gap-4 px-5 py-5">
			<fieldset class="space-y-3">
				<legend class="text-ui font-semibold text-[var(--color-text-primary)]">TPN Line 1</legend>
				<div class="flex gap-3">
					<NumericInput
						bind:value={feedsState.current.tpnDex1Pct}
						label="Dextrose"
						suffix="%"
						min={inputs.tpnDexPct.min}
						max={inputs.tpnDexPct.max}
						step={inputs.tpnDexPct.step}
						placeholder="10"
						id="feeds-dex1-pct"
						showRangeHint={true}
						showRangeError={true}
					/>
					<NumericInput
						bind:value={feedsState.current.tpnMl1Hr}
						label="Rate"
						suffix="ml/hr"
						min={inputs.tpnMlHr.min}
						max={inputs.tpnMlHr.max}
						step={inputs.tpnMlHr.step}
						placeholder="56"
						id="feeds-ml1-hr"
						showRangeHint={true}
						showRangeError={true}
					/>
				</div>
			</fieldset>
			<fieldset class="space-y-3">
				<legend class="text-ui font-semibold text-[var(--color-text-primary)]">TPN Line 2</legend>
				<div class="flex gap-3">
					<NumericInput
						bind:value={feedsState.current.tpnDex2Pct}
						label="Dextrose"
						suffix="%"
						min={inputs.tpnDexPct.min}
						max={inputs.tpnDexPct.max}
						step={inputs.tpnDexPct.step}
						placeholder="0"
						id="feeds-dex2-pct"
						showRangeHint={true}
						showRangeError={true}
					/>
					<NumericInput
						bind:value={feedsState.current.tpnMl2Hr}
						label="Rate"
						suffix="ml/hr"
						min={inputs.tpnMlHr.min}
						max={inputs.tpnMlHr.max}
						step={inputs.tpnMlHr.step}
						placeholder="0"
						id="feeds-ml2-hr"
						showRangeHint={true}
						showRangeError={true}
					/>
				</div>
			</fieldset>
			<RangedNumericInput
				bind:value={feedsState.current.smofMl}
				label="SMOF 20% lipid"
				suffix="ml"
				min={inputs.smofMl.min}
				max={inputs.smofMl.max}
				step={inputs.smofMl.step}
				placeholder="0"
				id="feeds-smof"
			/>
			<RangedNumericInput
				bind:value={feedsState.current.enteralMl}
				label="Enteral volume"
				suffix="ml"
				min={inputs.enteralMl.min}
				max={inputs.enteralMl.max}
				step={inputs.enteralMl.step}
				placeholder="200"
				id="feeds-enteral-ml"
			/>
			<SelectPicker
				label="Enteral caloric density"
				bind:value={kcalPerOzStr}
				options={kcalPerOzOptions}
			/>
		</section>
	{/if}
</div>
