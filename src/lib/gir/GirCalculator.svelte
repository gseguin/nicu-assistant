<script lang="ts">
	import { calculateGir } from './calculations.js';
	import { girState } from './state.svelte.js';
	import GlucoseTitrationGrid from './GlucoseTitrationGrid.svelte';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import config from './gir-config.json';
	import type { GlucoseBucket } from './types.js';
	import { Info } from '@lucide/svelte';

	// Plan 42.1-05 (D-08): inputs were extracted into GirInputs.svelte so the route can
	// place them in the desktop sticky right column or the mobile <InputDrawer>. The
	// calculator now renders the hero + GIR-tier advisories + titration grid only — the
	// titration grid stays BELOW the hero in the calculator (per orchestrator direction)
	// because each titration row carries its own per-row "current" affordance and depends
	// on the result.
	//
	// JSON import is inferred as `string` for `id`; re-narrow to the discriminated union
	// on the type side. Runtime shape is identical — this is type-only.
	const buckets = config.glucoseBuckets as unknown as GlucoseBucket[];

	let result = $derived(calculateGir(girState.current, buckets));

	let currentGir = $derived(result?.currentGirMgKgMin ?? null);

	let pulseKey = $derived(
		result ? `${result.currentGirMgKgMin.toFixed(1)}-${result.initialRateMlHr.toFixed(1)}` : ''
	);

	// Result-derived advisories live with the result on the calculator. The
	// dextrose-input advisory lives with the input in GirInputs.svelte (it is a
	// property of the input, not the result).
	let showGirHighAdvisory = $derived(currentGir != null && currentGir > 12);
	let showGirLowAdvisory = $derived(currentGir != null && currentGir > 0 && currentGir < 4);

	function handleSelectBucket(bucketId: string) {
		girState.current.selectedBucketId = bucketId;
	}

	// Persist on change. Kept here so the calculator also persists when mounted
	// without the inputs fragment — defensive.
	$effect(() => {
		JSON.stringify(girState.current);
		girState.persist();
	});
</script>

<div class="space-y-6">
	{#if result}
		{@const selectedRow = girState.current.selectedBucketId
			? result.titration.find((r) => r.bucketId === girState.current.selectedBucketId)
			: null}

		<!-- Hero shape: the grid IS the decision surface, so the hero promotes the
		     *selected action* — not a static Current GIR / Initial Rate pair. The
		     current state sits as a quiet line above the hero (baseline for
		     reference), and the action itself owns the display numeral. -->
		<div class="flex flex-col gap-1 px-1" aria-live="polite">
			<span
				class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
			>
				Current GIR
			</span>
			<div class="num flex flex-wrap items-baseline gap-x-3 gap-y-1 text-ui">
				<span class="flex items-baseline gap-1 text-base font-semibold text-[var(--color-text-primary)]">
					<span>{result.currentGirMgKgMin.toFixed(1)}</span>
					<span class="text-ui font-medium text-[var(--color-text-secondary)]">mg/kg/min</span>
				</span>
				<span class="flex items-baseline gap-1 text-[var(--color-text-tertiary)]">
					<span>running</span>
					<span class="text-[var(--color-text-primary)]">{result.initialRateMlHr.toFixed(1)}</span>
					<span>ml/hr</span>
				</span>
			</div>
		</div>

		{#if selectedRow}
			{@const stop = selectedRow.targetGirMgKgMin <= 0}
			{@const hold = !stop && selectedRow.deltaRateMlHr === 0}
			{@const delta = selectedRow.deltaRateMlHr}
			{@const absDelta = Math.abs(delta).toFixed(1)}
			{@const direction = delta > 0 ? 'increase' : 'decrease'}
			<HeroResult
				eyebrow={stop
					? 'SEVERE NEURO SIGNS'
					: `IF GLUCOSE ${selectedRow.label}${selectedRow.bucketId === 'severe-neuro' ? '' : ' MG/DL'}`}
				value=""
				pulseKey={`${selectedRow.bucketId}-${pulseKey}`}
				ariaLabel={stop
					? 'Severe neuro signs: stop dextrose infusion'
					: `Adjustment for glucose ${selectedRow.label}`}
				numericValue={stop ? null : selectedRow.targetRateMlHr}
			>
				{#snippet children()}
					<div class="flex flex-col gap-2">
						<span
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							{stop
								? 'SEVERE NEURO SIGNS'
								: `IF GLUCOSE ${selectedRow.label}${selectedRow.bucketId === 'severe-neuro' ? '' : ' MG/DL'}`}
						</span>
						{#if stop}
							<div class="flex items-baseline gap-2">
								<span
									class="text-display font-black tracking-wider text-[var(--color-text-primary)] uppercase"
									>STOP</span
								>
								<span class="text-ui text-[var(--color-text-secondary)]">dextrose infusion</span>
							</div>
						{:else if hold}
							<div class="flex items-baseline gap-2">
								<span
									class="text-display font-black tracking-wider text-[var(--color-text-primary)] uppercase"
									>Hold</span
								>
								<span class="text-ui text-[var(--color-text-secondary)]">rate (no change)</span>
							</div>
						{:else}
							<div class="flex items-baseline gap-2">
								<span
									class="num text-display font-black text-[var(--color-text-primary)]"
									aria-hidden="true">{delta > 0 ? '▲' : '▼'}</span
								>
								<span class="num text-display font-black text-[var(--color-text-primary)]">
									{absDelta}
								</span>
								<span class="text-ui font-medium text-[var(--color-text-secondary)]">ml/hr</span>
								<span class="text-ui text-[var(--color-text-tertiary)]">({direction})</span>
							</div>
							<span class="num text-ui text-[var(--color-text-secondary)]">
								New rate {selectedRow.targetRateMlHr.toFixed(1)} ml/hr · target GIR {selectedRow.targetGirMgKgMin.toFixed(1)} mg/kg/min
							</span>
						{/if}
					</div>
				{/snippet}
			</HeroResult>
		{:else}
			<!-- No row selected yet: a quieter prompt card that invites selection,
			     still carrying the identity-tinted hero surface so the visual weight
			     stays consistent when the action arrives. -->
			<section
				class="card px-5 py-5"
				style="background: var(--color-identity-hero);"
				aria-label="Titration action"
			>
				<div class="flex flex-col gap-2">
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
					>
						TITRATION
					</span>
					<p class="num text-display font-black text-[var(--color-text-primary)]">
						{result.initialRateMlHr.toFixed(1)}<span
							class="text-ui font-medium text-[var(--color-text-secondary)]"
						>
							ml/hr
						</span>
					</p>
					<span class="text-ui text-[var(--color-text-secondary)]">
						Select a glucose range below to see the adjustment.
					</span>
				</div>
			</section>
		{/if}
	{:else}
		<HeroResult
			eyebrow="CURRENT GIR"
			value=""
			pulseKey="empty-gir"
			ariaLabel="Glucose infusion rate result"
		>
			{#snippet children()}
				<div class="flex flex-col gap-2">
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
					>
						CURRENT GIR
					</span>
					<p class="text-ui text-[var(--color-text-secondary)]">
						Enter weight, dextrose, and fluid rate to see GIR.
					</p>
				</div>
			{/snippet}
		</HeroResult>
	{/if}

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
