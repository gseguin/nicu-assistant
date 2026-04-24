<script lang="ts">
	import { calculateFortification } from '$lib/fortification/calculations.js';
	import { getFormulaById } from '$lib/fortification/fortification-config.js';
	import { untrack } from 'svelte';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import type { UnitType } from './types.js';

	// Plan 42.1-05 (D-08): inputs were extracted into FortificationInputs.svelte so the route
	// can place them in the desktop sticky right column or the mobile <InputDrawer>. The
	// calculator now renders the hero + verification card only — the result is the interface.

	const UNIT_LABELS: Record<UnitType, string> = {
		grams: 'Grams',
		scoops: 'Scoops',
		teaspoons: 'Teaspoons',
		tablespoons: 'Tablespoons',
		packets: 'Packets'
	};

	// --- Result derivation --------------------------------------------------
	let result = $derived.by(() => {
		const { base, volumeMl, formulaId, targetKcalOz, unit } = fortificationState.current;
		if (volumeMl === null || volumeMl <= 0) return null;
		const formula = getFormulaById(formulaId);
		if (!formula) return null;
		return calculateFortification({ formula, base, volumeMl, targetKcalOz, unit });
	});

	let unitLabel = $derived(UNIT_LABELS[fortificationState.current.unit] ?? '');

	// Animation re-trigger key: bumps whenever result identity changes so
	// {#key calcKey} re-mounts the hero inner wrapper and replays .animate-result-pulse.
	let calcKey = $state(0);
	$effect(() => {
		void result?.amountToAdd;
		void result?.yieldMl;
		void result?.exactKcalPerOz;
		untrack(() => {
			calcKey += 1;
		});
	});

	function formatAmount(n: number): string {
		// D-23: keep one decimal so .num tabular alignment holds and clinically
		// meaningful precision is preserved (`'2.0'` not `'2'`).
		if (n === 0) return '0.0';
		return n.toFixed(1);
	}

	// Persist on any state change (mirror morphine). Kept here so the calculator
	// also persists when mounted without the inputs fragment — defensive.
	$effect(() => {
		JSON.stringify(fortificationState.current);
		fortificationState.persist();
	});
</script>

<div class="space-y-6">
	<!-- Hero: Amount to Add -->
	{#if result}
		<HeroResult
			eyebrow="AMOUNT TO ADD"
			value={formatAmount(result.amountToAdd)}
			unit={unitLabel}
			pulseKey={calcKey}
		/>
	{:else}
		<HeroResult eyebrow="AMOUNT TO ADD" value="" pulseKey={calcKey}>
			{#snippet children()}
				<div class="flex flex-col gap-2">
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
					>
						AMOUNT TO ADD
					</span>
					<p class="text-sm text-[var(--color-text-tertiary)]">
						Enter a starting volume to see the recipe.
					</p>
				</div>
			{/snippet}
		</HeroResult>
	{/if}

	<!-- Verification Card -->
	{#if result}
		<section class="card" aria-label="Verification">
			<span class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">
				Verification
			</span>
			<dl class="mt-3 flex flex-col gap-3">
				<div class="flex items-baseline justify-between">
					<dt class="text-sm font-medium text-[var(--color-text-secondary)]">Yield</dt>
					<dd class="num text-base font-semibold text-[var(--color-text-primary)]">
						{result.yieldMl.toFixed(1)} mL
					</dd>
				</div>
				<div class="flex items-baseline justify-between">
					<dt class="text-sm font-medium text-[var(--color-text-secondary)]">Exact</dt>
					<dd class="num text-base font-semibold text-[var(--color-text-primary)]">
						{result.exactKcalPerOz.toFixed(1)} kcal/oz
					</dd>
				</div>
				<div class="flex items-baseline justify-between">
					<dt class="text-sm font-medium text-[var(--color-text-secondary)]">Suggested start</dt>
					<dd class="num text-base font-semibold text-[var(--color-text-primary)]">
						{result.suggestedStartingVolumeMl}
					</dd>
				</div>
			</dl>
		</section>
	{/if}
</div>
