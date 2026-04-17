<script lang="ts">
	import {
		calculateBedsideAdvance,
		calculateFullNutrition,
		calculateIvBackfillRate,
		checkAdvisories
	} from './calculations.js';
	import { feedsState } from './state.svelte.js';
	import {
		inputs,
		defaults,
		frequencyOptions,
		cadenceOptions,
		advisories,
		getFrequencyById,
		getCadenceById,
		resolveAdvanceEventsPerDay
	} from './feeds-config.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
	import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
	import { AlertTriangle } from '@lucide/svelte';
	import type { SelectOption } from '$lib/shared/types.js';

	// ---------------------------------------------------------------------------
	// Derived calculations
	// ---------------------------------------------------------------------------

	let freq = $derived(getFrequencyById(feedsState.current.trophicFrequency));
	let feedsPerDay = $derived(freq?.feedsPerDay ?? 8);
	let feedHours = $derived(24 / feedsPerDay);
	let cadence = $derived(getCadenceById(feedsState.current.advanceCadence));
	// D-20: Floor rounding for clinical safety -- always round down advance events
	let advanceEventsPerDay = $derived(
		cadence ? Math.floor(resolveAdvanceEventsPerDay(cadence, feedsPerDay)) : 2
	);

	let bedsideResult = $derived(
		feedsState.current.weightKg != null
			? calculateBedsideAdvance(
					feedsState.current.weightKg,
					feedsState.current.trophicMlKgDay ?? defaults.trophicMlKgDay,
					feedsState.current.advanceMlKgDay ?? defaults.advanceMlKgDay,
					feedsState.current.goalMlKgDay ?? defaults.goalMlKgDay,
					feedsPerDay,
					advanceEventsPerDay
				)
			: null
	);

	let fullNutritionResult = $derived(
		feedsState.current.weightKg != null
			? calculateFullNutrition(
					feedsState.current.weightKg,
					feedsState.current.tpnDex1Pct ?? 0,
					feedsState.current.tpnMl1Hr ?? 0,
					feedsState.current.tpnDex2Pct ?? 0,
					feedsState.current.tpnMl2Hr ?? 0,
					feedsState.current.smofMl ?? 0,
					feedsState.current.enteralMl ?? 0,
					feedsState.current.enteralKcalPerOz ?? defaults.enteralKcalPerOz
				)
			: null
	);

	let ivBackfillRate = $derived(
		bedsideResult && feedsState.current.totalFluidsMlHr != null
			? calculateIvBackfillRate(
					feedsState.current.totalFluidsMlHr,
					bedsideResult.goalMlPerFeed,
					feedHours
				)
			: null
	);

	// ---------------------------------------------------------------------------
	// Advisories
	// ---------------------------------------------------------------------------

	let triggeredAdvisories = $derived(
		checkAdvisories(
			{
				weightKg: feedsState.current.weightKg,
				trophicMlKgDay: feedsState.current.trophicMlKgDay,
				advanceMlKgDay: feedsState.current.advanceMlKgDay,
				goalMlKgDay: feedsState.current.goalMlKgDay,
				tpnDex1Pct: feedsState.current.tpnDex1Pct,
				tpnDex2Pct: feedsState.current.tpnDex2Pct
			},
			{
				totalKcalPerKgDay: fullNutritionResult?.totalKcalPerKgDay ?? 0
			},
			feedsState.current.mode,
			advisories
		)
	);

	// ---------------------------------------------------------------------------
	// Persist on change
	// ---------------------------------------------------------------------------

	$effect(() => {
		JSON.stringify(feedsState.current);
		feedsState.persist();
	});

	// ---------------------------------------------------------------------------
	// SelectPicker option arrays
	// ---------------------------------------------------------------------------

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
	<!-- SHARED: Weight input (always visible above toggle) -->
	<section class="card flex flex-col gap-4">
		<NumericInput
			bind:value={feedsState.current.weightKg}
			label="Weight"
			suffix="kg"
			min={inputs.weightKg.min}
			max={inputs.weightKg.max}
			step={inputs.weightKg.step}
			placeholder="1.94"
			id="feeds-weight"
			showRangeHint={true}
			showRangeError={true}
		/>
	</section>

	<!-- MODE TOGGLE -->
	<SegmentedToggle
		label="Calculator mode"
		bind:value={feedsState.current.mode}
		options={[
			{ value: 'bedside', label: 'Bedside Advancement' },
			{ value: 'full-nutrition', label: 'Full Nutrition' }
		]}
	/>

	{#if feedsState.current.mode === 'bedside'}
		<!-- BEDSIDE INPUTS -->
		<section class="card flex flex-col gap-4">
			<NumericInput
				bind:value={feedsState.current.trophicMlKgDay}
				label="Trophic"
				suffix="ml/kg/d"
				min={inputs.trophicMlKgDay.min}
				max={inputs.trophicMlKgDay.max}
				step={inputs.trophicMlKgDay.step}
				placeholder="20"
				id="feeds-trophic"
				showRangeHint={true}
				showRangeError={true}
			/>
			<NumericInput
				bind:value={feedsState.current.advanceMlKgDay}
				label="Advance"
				suffix="ml/kg/d"
				min={inputs.advanceMlKgDay.min}
				max={inputs.advanceMlKgDay.max}
				step={inputs.advanceMlKgDay.step}
				placeholder="30"
				id="feeds-advance"
				showRangeHint={true}
				showRangeError={true}
			/>
			<NumericInput
				bind:value={feedsState.current.goalMlKgDay}
				label="Goal"
				suffix="ml/kg/d"
				min={inputs.goalMlKgDay.min}
				max={inputs.goalMlKgDay.max}
				step={inputs.goalMlKgDay.step}
				placeholder="160"
				id="feeds-goal"
				showRangeHint={true}
				showRangeError={true}
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
		</section>

		<!-- BEDSIDE OUTPUTS: Three equally-prominent rows -->
		<section class="card" aria-live="polite" aria-atomic="true">
			{#if bedsideResult}
				<div class="flex flex-col divide-y divide-[var(--color-border)]">
					<!-- Trophic -->
					<div class="flex items-baseline justify-between px-5 py-4">
						<div>
							<div
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								Trophic
							</div>
							<div class="flex items-baseline gap-2">
								<span class="num text-title font-bold text-[var(--color-text-primary)]">
									{bedsideResult.trophicMlPerFeed.toFixed(1)}
								</span>
								<span class="text-ui text-[var(--color-text-secondary)]">ml/feed</span>
							</div>
						</div>
						<span class="num text-ui text-[var(--color-text-tertiary)]">
							{bedsideResult.trophicMlKgDay} ml/kg/d
						</span>
					</div>

					<!-- Advance step -->
					<div class="flex items-baseline justify-between px-5 py-4">
						<div>
							<div
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								Advance step
							</div>
							<div class="flex items-baseline gap-2">
								<span class="num text-title font-bold text-[var(--color-text-primary)]">
									{bedsideResult.advanceStepMlPerFeed.toFixed(1)}
								</span>
								<span class="text-ui text-[var(--color-text-secondary)]">ml/feed</span>
							</div>
						</div>
						<span class="num text-ui text-[var(--color-text-tertiary)]">
							{bedsideResult.advanceMlKgDay} ml/kg/d
						</span>
					</div>

					<!-- Goal -->
					<div class="flex items-baseline justify-between px-5 py-4">
						<div>
							<div
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								Goal
							</div>
							<div class="flex items-baseline gap-2">
								<span class="num text-title font-bold text-[var(--color-text-primary)]">
									{bedsideResult.goalMlPerFeed.toFixed(1)}
								</span>
								<span class="text-ui text-[var(--color-text-secondary)]">ml/feed</span>
							</div>
						</div>
						<span class="num text-ui text-[var(--color-text-tertiary)]">
							{bedsideResult.goalMlKgDay} ml/kg/d
						</span>
					</div>
				</div>
			{:else}
				<p class="px-5 py-5 text-ui text-[var(--color-text-secondary)]">
					Enter a weight to see per-feed volumes.
				</p>
			{/if}
		</section>

		<!-- TOTAL FLUIDS + IV BACKFILL -->
		<section class="card flex flex-col gap-4 px-5 py-5">
			{#if bedsideResult}
				<div>
					<div
						class="text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
					>
						Computed total fluids
					</div>
					<div class="flex items-baseline gap-2">
						<span class="num text-title font-bold text-[var(--color-text-primary)]">
							{bedsideResult.totalFluidsMlHr.toFixed(1)}
						</span>
						<span class="text-ui text-[var(--color-text-secondary)]">ml/hr</span>
					</div>
				</div>
			{/if}

			<NumericInput
				bind:value={feedsState.current.totalFluidsMlHr}
				label="Total fluids (for IV backfill)"
				suffix="ml/hr"
				min={inputs.totalFluidsMlHr.min}
				max={inputs.totalFluidsMlHr.max}
				step={inputs.totalFluidsMlHr.step}
				placeholder="12"
				id="feeds-total-fluids"
				showRangeHint={true}
				showRangeError={true}
			/>

			{#if ivBackfillRate != null}
				<div>
					<div class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">
						Estimated IV rate to meet TFI
					</div>
					<div class="flex items-baseline gap-2">
						<span class="num text-title font-bold text-[var(--color-text-primary)]">
							{ivBackfillRate.toFixed(1)}
						</span>
						<span class="text-ui text-[var(--color-text-secondary)]">ml/hr</span>
					</div>
					<p class="mt-1 text-2xs text-[var(--color-text-tertiary)]">
						Institution-specific — verify against your unit protocol
					</p>
				</div>
			{/if}
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
			<NumericInput
				bind:value={feedsState.current.smofMl}
				label="SMOF 20% lipid"
				suffix="ml"
				min={inputs.smofMl.min}
				max={inputs.smofMl.max}
				step={inputs.smofMl.step}
				placeholder="0"
				id="feeds-smof"
				showRangeHint={true}
				showRangeError={true}
			/>
			<NumericInput
				bind:value={feedsState.current.enteralMl}
				label="Enteral volume"
				suffix="ml"
				min={inputs.enteralMl.min}
				max={inputs.enteralMl.max}
				step={inputs.enteralMl.step}
				placeholder="200"
				id="feeds-enteral-ml"
				showRangeHint={true}
				showRangeError={true}
			/>
			<SelectPicker
				label="Enteral caloric density"
				bind:value={kcalPerOzStr}
				options={kcalPerOzOptions}
			/>
		</section>

		<!-- FULL NUTRITION HERO: total kcal/kg/d -->
		<section
			class="card px-5 py-5"
			style="background: var(--color-identity-hero);"
			aria-live="polite"
			aria-atomic="true"
		>
			{#if fullNutritionResult}
				<div class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">
					TOTAL KCAL/KG/DAY
				</div>
				<div class="flex items-baseline gap-2">
					<span class="num text-display font-black text-[var(--color-text-primary)]">
						{fullNutritionResult.totalKcalPerKgDay.toFixed(1)}
					</span>
					<span class="text-ui text-[var(--color-text-secondary)]">kcal/kg/d</span>
				</div>
			{:else}
				<p class="text-ui text-[var(--color-text-secondary)]">
					Enter a weight to see nutrition totals.
				</p>
			{/if}
		</section>

		<!-- SECONDARY OUTPUTS: summary grid -->
		{#if fullNutritionResult}
			<section class="card px-5 py-5">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
						>
							Dextrose kcal
						</div>
						<span class="num text-title font-bold text-[var(--color-text-primary)]">
							{fullNutritionResult.dextroseKcal.toFixed(1)}
						</span>
					</div>
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
						>
							Lipid kcal
						</div>
						<span class="num text-title font-bold text-[var(--color-text-primary)]">
							{fullNutritionResult.lipidKcal.toFixed(1)}
						</span>
					</div>
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
						>
							Enteral kcal
						</div>
						<span class="num text-title font-bold text-[var(--color-text-primary)]">
							{fullNutritionResult.enteralKcal.toFixed(1)}
						</span>
					</div>
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
						>
							ml/kg total
						</div>
						<span class="num text-title font-bold text-[var(--color-text-primary)]">
							{fullNutritionResult.mlPerKg.toFixed(1)}
						</span>
					</div>
				</div>
			</section>
		{/if}
	{/if}

	<!-- ADVISORIES -->
	{#each triggeredAdvisories as advisory (advisory.id)}
		<div
			class="flex items-start gap-3 rounded-xl border-l-4 px-4 py-3"
			style="background: var(--color-bmf-50); border-left-color: var(--color-bmf-600);"
			role="note"
		>
			<AlertTriangle
				size={20}
				class="mt-0.5 shrink-0 text-[var(--color-bmf-600)]"
				aria-hidden="true"
			/>
			<p class="text-base font-semibold text-[var(--color-text-primary)]">{advisory.message}</p>
		</div>
	{/each}
</div>
