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
	<!-- PAIRED HEROES: Current GIR + Initial rate (mirrors UAC/UVC paired pattern).
	     Each hero owns its own text-display numeral per the HeroResult contract. -->
	{#if result}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<HeroResult
				eyebrow="CURRENT GIR"
				value={result.currentGirMgKgMin.toFixed(1)}
				unit="mg/kg/min"
				pulseKey={pulseKey}
				ariaLabel="Current glucose infusion rate"
			/>
			<HeroResult
				eyebrow="INITIAL RATE"
				value={result.initialRateMlHr.toFixed(1)}
				unit="ml/hr"
				pulseKey={pulseKey}
				ariaLabel="Initial fluid rate"
			/>
		</div>
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
						Enter weight, dextrose %, and fluid rate to compute GIR
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
