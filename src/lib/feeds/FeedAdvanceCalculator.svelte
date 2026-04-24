<script lang="ts">
	import {
		calculateBedsideAdvance,
		calculateFullNutrition,
		calculateIvBackfillRate,
		checkAdvisories
	} from './calculations.js';
	import { feedsState } from './state.svelte.js';
	import {
		defaults,
		advisories,
		getFrequencyById,
		getCadenceById,
		resolveAdvanceEventsPerDay
	} from './feeds-config.js';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import { AlertTriangle } from '@lucide/svelte';

	// Plan 42.1-05 (D-08): inputs (Weight + mode toggle + per-mode inputs incl. the
	// total-fluids-for-backfill field) were extracted into FeedAdvanceInputs.svelte
	// so the route can place them in the desktop sticky right column or the mobile
	// <InputDrawer>. The calculator now renders the result hero + per-mode output
	// breakdown + computed totals + advisories — the result is the interface.

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
	// Persist on change. Kept here so the calculator also persists when mounted
	// without the inputs fragment — defensive.
	// ---------------------------------------------------------------------------

	$effect(() => {
		JSON.stringify(feedsState.current);
		feedsState.persist();
	});
</script>

<div class="space-y-6">
	{#if feedsState.current.mode === 'bedside'}
		<!-- BEDSIDE PRIMARY HERO: Goal ml/feed (most actionable advancement target) -->
		{#if bedsideResult}
			<HeroResult
				eyebrow="GOAL ML/FEED"
				value={bedsideResult.goalMlPerFeed.toFixed(1)}
				unit="ml/feed"
				pulseKey={bedsideResult.goalMlPerFeed}
			/>
		{/if}

		<!-- BEDSIDE OUTPUTS: Three equally-prominent rows -->
		<section class="card">
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

		<!-- COMPUTED TOTALS + IV BACKFILL (output-only — input moved to FeedAdvanceInputs) -->
		{#if bedsideResult}
			<section class="card flex flex-col gap-4 px-5 py-5">
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
						<p class="mt-1 text-ui text-[var(--color-text-tertiary)]">
							Institution-specific. Verify against your unit protocol.
						</p>
					</div>
				{/if}
			</section>
		{/if}
	{:else}
		<!-- FULL NUTRITION HERO: total kcal/kg/d -->
		{#if fullNutritionResult}
			<HeroResult
				eyebrow="TOTAL KCAL/KG/DAY"
				value={fullNutritionResult.totalKcalPerKgDay.toFixed(1)}
				unit="kcal/kg/d"
				pulseKey={fullNutritionResult.totalKcalPerKgDay}
			/>
		{:else}
			<HeroResult eyebrow="TOTAL KCAL/KG/DAY" value="" pulseKey="empty">
				{#snippet children()}
					<div class="flex flex-col gap-2">
						<span
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							TOTAL KCAL/KG/DAY
						</span>
						<p class="text-ui text-[var(--color-text-secondary)]">
							Enter a weight to see nutrition totals.
						</p>
					</div>
				{/snippet}
			</HeroResult>
		{/if}

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
			class="flex items-start gap-3 rounded-xl border px-4 py-3"
			style="background: var(--color-bmf-50); border-color: var(--color-bmf-300);"
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
