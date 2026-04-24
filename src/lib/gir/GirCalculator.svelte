<script lang="ts">
	import { calculateGir } from './calculations.js';
	import { girState } from './state.svelte.js';
	import GlucoseTitrationGrid from './GlucoseTitrationGrid.svelte';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import config from './gir-config.json';
	import type { GirInputRanges, GlucoseBucket } from './types.js';
	import { AlertTriangle, Info } from '@lucide/svelte';

	const inputs = config.inputs as GirInputRanges;
	// JSON import is inferred as `string` for `id`; re-narrow to the discriminated
	// union on the type side. Runtime shape is identical — this is type-only.
	const buckets = config.glucoseBuckets as unknown as GlucoseBucket[];

	let result = $derived(calculateGir(girState.current, buckets));

	let currentGir = $derived(result?.currentGirMgKgMin ?? null);
	let initialRate = $derived(result?.initialRateMlHr ?? null);

	let pulseKey = $derived(
		result ? `${result.currentGirMgKgMin.toFixed(1)}-${result.initialRateMlHr.toFixed(1)}` : ''
	);

	// Advisory flags
	let showDexAdvisory = $derived(
		girState.current.dextrosePct != null && girState.current.dextrosePct > 12.5
	);
	let showGirHighAdvisory = $derived(currentGir != null && currentGir > 12);
	let showGirLowAdvisory = $derived(currentGir != null && currentGir > 0 && currentGir < 4);

	function handleSelectBucket(bucketId: string) {
		girState.current.selectedBucketId = bucketId;
	}

	// Persist on change
	$effect(() => {
		JSON.stringify(girState.current);
		girState.persist();
	});
</script>

<div class="space-y-6">
	<!-- INPUTS CARD -->
	<section class="card flex flex-col gap-4">
		<NumericInput
			bind:value={girState.current.weightKg}
			label="Weight"
			suffix="kg"
			min={inputs.weightKg.min}
			max={inputs.weightKg.max}
			step={inputs.weightKg.step}
			placeholder="3.1"
			id="gir-weight"
			showRangeHint={true}
			showRangeError={true}
		/>
		<NumericInput
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
				class="flex items-start gap-3 rounded-xl border px-4 py-3"
				style="background: var(--color-bmf-50); border-color: var(--color-bmf-300);"
				role="note"
			>
				<AlertTriangle
					size={20}
					class="mt-0.5 shrink-0 text-[var(--color-bmf-600)]"
					aria-hidden="true"
				/>
				<p class="text-base font-semibold text-[var(--color-text-primary)]">
					Dextrose &gt;12.5% requires central venous access
				</p>
			</div>
		{/if}

		<NumericInput
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

	<!-- CURRENT GIR HERO -->
	<HeroResult eyebrow="" value="" pulseKey={pulseKey} ariaLabel="Glucose infusion rate result">
		{#snippet children()}
			{#if result}
				<div class="flex flex-col gap-3">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							CURRENT GIR
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-display font-black text-[var(--color-text-primary)]"
								>{result.currentGirMgKgMin.toFixed(1)}</span
							>
							<span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min</span>
						</div>
					</div>
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							INITIAL RATE
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-bold text-[var(--color-text-primary)]"
								>{result.initialRateMlHr.toFixed(1)}</span
							>
							<span class="text-ui text-[var(--color-text-secondary)]">ml/hr</span>
						</div>
					</div>
				</div>
			{:else}
				<p class="text-ui text-[var(--color-text-secondary)]">
					Enter weight, dextrose %, and fluid rate to compute GIR
				</p>
			{/if}
		{/snippet}
	</HeroResult>

	<!-- Tier 2 advisories -->
	{#if showGirHighAdvisory}
		<div class="card flex items-start gap-2 px-4 py-3">
			<Info
				size={16}
				class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
				aria-hidden="true"
			/>
			<p class="text-ui text-[var(--color-text-secondary)]">
				GIR &gt;12 mg/kg/min. Consider hyperinsulinism workup or central access.
			</p>
		</div>
	{/if}
	{#if showGirLowAdvisory}
		<div class="card flex items-start gap-2 px-4 py-3">
			<Info
				size={16}
				class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
				aria-hidden="true"
			/>
			<p class="text-ui text-[var(--color-text-secondary)]">
				Below basal glucose utilization (≈4–6 mg/kg/min)
			</p>
		</div>
	{/if}

	<!-- TITRATION GRID HEADER + GRID -->
	{#if result}
		<section class="space-y-2">
			<h2 class="text-ui font-semibold text-[var(--color-text-primary)]">If current glucose is…</h2>
			<p class="text-ui text-[var(--color-text-tertiary)]">
				Institutional titration helper. Verify against your protocol before acting.
			</p>
			<GlucoseTitrationGrid
				rows={result.titration}
				selectedBucketId={girState.current.selectedBucketId}
				onselect={handleSelectBucket}
			/>
		</section>
	{/if}
</div>
