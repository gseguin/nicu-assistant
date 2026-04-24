<script lang="ts">
	import { calculateLinearSchedule } from '$lib/morphine/calculations.js';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import { formatMg, formatPercent } from './format.js';
	import type { WeanStep, MorphineInputRanges } from '$lib/morphine/types.js';
	import config from '$lib/morphine/morphine-config.json';

	const inputs = config.inputs as MorphineInputRanges;

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

	// Persist state on change
	$effect(() => {
		JSON.stringify(morphineState.current);
		morphineState.persist();
	});

	// Clear button visibility
	let hasValues = $derived(
		morphineState.current.weightKg !== null ||
			morphineState.current.maxDoseMgKgDose !== null ||
			morphineState.current.decreasePct !== null
	);

	function clearInputs() {
		morphineState.reset();
	}
</script>

<div class="space-y-6">
	<!-- Inputs Card -->
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
	</section>

	<!-- Schedule content (single instance — reacts to activeMode via derived schedule) -->
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
				<div
					data-testid="morphine-summary"
					class="flex items-center justify-between"
				>
					<div class="flex flex-col">
						<span class="text-2xs font-semibold text-[var(--color-identity)]">Start</span>
						<span class="num text-base font-bold text-[var(--color-text-primary)]"
							>{formatMg(first.doseMg)} mg</span
						>
					</div>
					<div class="text-lg text-[var(--color-text-tertiary)]">→</div>
					<div class="flex flex-col items-end">
						<span class="text-2xs font-semibold text-[var(--color-identity)]">Step {last.step}</span>
						<span class="num text-base font-bold text-[var(--color-text-primary)]"
							>{formatMg(last.doseMg)} mg</span
						>
					</div>
					<div class="flex flex-col items-end">
						<span class="text-2xs font-semibold text-[var(--color-identity)]">Total reduction</span>
						<span class="num text-sm font-semibold text-[var(--color-text-primary)]"
							>{formatPercent((totalReduction / first.doseMg) * 100)}</span
						>
					</div>
				</div>
			{/snippet}
		</HeroResult>

		<section aria-label="Weaning schedule" aria-live="polite" aria-atomic="true" class="mt-4">
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
				Enter values above to generate weaning schedule.
			</p>
		</div>
	{/if}

	<!-- Clear Button -->
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
</div>
