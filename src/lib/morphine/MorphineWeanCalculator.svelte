<script lang="ts">
	import { calculateLinearSchedule } from '$lib/morphine/calculations.js';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import { formatMg, formatPercent } from './format.js';
	import type { WeanStep } from '$lib/morphine/types.js';

	// Plan 42.1-05 (D-08): inputs were extracted into MorphineWeanInputs.svelte so the route
	// can place them in the desktop sticky right column or the mobile <InputDrawer>. The
	// calculator now renders the hero + schedule only — the result is the interface.

	// 42.1-04 D-16: Dock-style scroll magnification was removed (DESIGN.md "no scroll-driven
	// animation" rule). The active step is now selected by tap, expressed via aria-current="step"
	// + an inset identity ring on the active row.
	let activeStepIndex = $state<number | null>(null);

	// Derived schedule computation
	let schedule: WeanStep[] = $derived.by(() => {
		const { weightKg, maxDoseMgKgDose, decreasePct } = morphineState.current;
		if (weightKg === null || maxDoseMgKgDose === null || decreasePct === null) return [];
		if (weightKg <= 0 || maxDoseMgKgDose <= 0 || decreasePct <= 0) return [];
		const pct = decreasePct / 100; // convert from percentage integer to decimal
		return calculateLinearSchedule(weightKg, maxDoseMgKgDose, pct);
	});

	// Recalculation feedback: derive a key from schedule identity to trigger CSS animation via {#key}
	let calcKey = $derived(
		schedule.length > 0 ? `${schedule[0].doseMg}-${schedule[schedule.length - 1].doseMg}` : ''
	);
</script>

<div class="space-y-4">
	<!-- Schedule content (single instance — reacts to morphineState via derived schedule) -->
	{#if schedule.length > 0}
		<!-- Summary: start → end dose (pulses on recalculation) -->
		{@const first = schedule[0]}
		{@const last = schedule[schedule.length - 1]}
		{@const totalReduction = first.doseMg - last.doseMg}
		<HeroResult
			eyebrow="WEANING SUMMARY"
			value=""
			pulseKey={calcKey}
			ariaLabel="Weaning summary"
		>
			{#snippet children()}
				<div data-testid="morphine-summary" class="flex flex-col gap-2">
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
					>
						WEANING SUMMARY
					</span>
					<div class="flex items-baseline gap-2">
						<span class="num text-display font-black text-[var(--color-text-primary)]"
							>{formatPercent((totalReduction / first.doseMg) * 100)}</span
						>
						<span class="text-ui font-medium text-[var(--color-text-secondary)]">
							Total reduction
						</span>
					</div>
					<span class="num text-ui text-[var(--color-text-secondary)]">
						Start {formatMg(first.doseMg)} to Step {last.step} {formatMg(last.doseMg)} mg
					</span>
				</div>
			{/snippet}
		</HeroResult>

		<section aria-label="Weaning schedule" aria-live="polite" aria-atomic="true">
			<div class="space-y-2">
				{#each schedule as step, i}
					{@const isFirst = step.step === 1}
					{@const isActive = i === activeStepIndex}
					{@const reductionPct =
						i > 0 && schedule[i - 1].doseMg > 0
							? (step.reductionMg / schedule[i - 1].doseMg) * 100
							: 0}
					<div
						data-step-index={i}
						aria-current={isActive ? 'step' : undefined}
						onclick={() => (activeStepIndex = i)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								activeStepIndex = i;
							}
						}}
						role="button"
						tabindex="0"
						class="card flex origin-center cursor-pointer flex-col gap-1 px-4 py-3 {isActive
							? 'ring-1 ring-inset ring-[var(--color-identity)]'
							: ''}"
					>
						<div class="flex items-center justify-between">
							<span
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								{isFirst ? 'Step 1: Starting dose' : `Step ${step.step}`}
							</span>
							{#if step.reductionMg > 0}
								<span class="pr-1 text-2xs font-medium text-[var(--color-text-tertiary)]"
									>-{formatMg(step.reductionMg)} mg ({formatPercent(reductionPct)})</span
								>
							{/if}
						</div>
						<div class="flex items-baseline gap-2">
							<span
								class="{isFirst
									? 'text-xl'
									: 'text-lg'} num font-bold text-[var(--color-text-primary)]"
								>{formatMg(step.doseMg)}</span
							>
							<span class="text-sm text-[var(--color-text-tertiary)]">mg</span>
						</div>
						<div class="num text-2xs font-medium text-[var(--color-text-secondary)]">
							{formatMg(step.doseMgKgDose)} mg/kg/dose
						</div>
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<div
			class="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center"
			aria-hidden="true"
		>
			<p class="text-sm font-medium text-[var(--color-text-tertiary)]">
				Enter values to generate weaning schedule.
			</p>
		</div>
	{/if}
</div>
