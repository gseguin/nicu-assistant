<script lang="ts">
	import { pertState } from './state.svelte.js';
	import {
		advisories,
		validationMessages,
		getFormulaById
	} from './config.js';
	import {
		computeOralResult,
		computeTubeFeedResult,
		getTriggeredAdvisories
	} from './calculations.js';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import { OctagonAlert } from '@lucide/svelte';
	import { AlertTriangle } from '@lucide/svelte';

	// Empty-state gate per D-08. Per-mode required-input set; ANY null/<= 0 hides
	// secondaries + advisories and shows the empty-state hero copy. Note the gate
	// uses input checks (NOT result-zero checks) because the calc layer returns
	// zero defensively on bad inputs (D-02), and zero is a valid clinical result
	// for a very low fat dose.
	let isOralValid = $derived.by(() => {
		const s = pertState.current;
		if (s.mode !== 'oral') return false;
		if (s.weightKg === null || s.weightKg <= 0) return false;
		if (s.medicationId === null) return false;
		if (s.strengthValue === null || s.strengthValue <= 0) return false;
		if (s.oral.fatGrams === null || s.oral.fatGrams <= 0) return false;
		if (s.oral.lipasePerKgPerMeal === null || s.oral.lipasePerKgPerMeal <= 0) return false;
		return true;
	});

	let isTubeFeedValid = $derived.by(() => {
		const s = pertState.current;
		if (s.mode !== 'tube-feed') return false;
		if (s.weightKg === null || s.weightKg <= 0) return false;
		if (s.medicationId === null) return false;
		if (s.strengthValue === null || s.strengthValue <= 0) return false;
		if (s.tubeFeed.formulaId === null) return false;
		if (s.tubeFeed.volumePerDayMl === null || s.tubeFeed.volumePerDayMl <= 0) return false;
		if (s.tubeFeed.lipasePerKgPerDay === null || s.tubeFeed.lipasePerKgPerDay <= 0) return false;
		// Defensive: stale formulaId from older localStorage may not resolve.
		if (getFormulaById(s.tubeFeed.formulaId) === undefined) return false;
		return true;
	});

	// Result derivation: only compute when the empty-state gate passes; otherwise
	// null. The calc layer returns zero results on bad inputs but the render layer
	// must hide the secondaries entirely when empty (D-08), so null is the gate.
	let oralResult = $derived.by(() => {
		if (!isOralValid) return null;
		const s = pertState.current;
		return computeOralResult({
			fatGrams: s.oral.fatGrams!,
			lipasePerKgPerMeal: s.oral.lipasePerKgPerMeal!,
			strengthValue: s.strengthValue!
		});
	});

	let tubeFeedResult = $derived.by(() => {
		if (!isTubeFeedValid) return null;
		const s = pertState.current;
		const formula = getFormulaById(s.tubeFeed.formulaId!)!;
		return computeTubeFeedResult({
			formulaFatGPerL: formula.fatGPerL,
			volumePerDayMl: s.tubeFeed.volumePerDayMl!,
			lipasePerKgPerDay: s.tubeFeed.lipasePerKgPerDay!,
			weightKg: s.weightKg!,
			strengthValue: s.strengthValue!
		});
	});

	// Advisories: severity-DESC order is enforced by getTriggeredAdvisories per
	// D-10. We split into stop / warning here for the two render branches below.
	// On empty-state (result null) the calc layer returns []; render is a no-op.
	let triggeredAdvisories = $derived(
		getTriggeredAdvisories(
			pertState.current.mode,
			pertState.current,
			pertState.current.mode === 'oral' ? oralResult : tubeFeedResult,
			advisories
		)
	);

	let stopAdvisories = $derived(triggeredAdvisories.filter((a) => a.severity === 'stop'));
	let warningAdvisories = $derived(triggeredAdvisories.filter((a) => a.severity === 'warning'));

	// Hero values: capsulesPerDose for oral, capsulesPerDay for tube-feed.
	// `null` means empty-state; the children-snippet renders the empty copy.
	let heroValue = $derived.by(() => {
		if (pertState.current.mode === 'oral' && oralResult) {
			return oralResult.capsulesPerDose;
		}
		if (pertState.current.mode === 'tube-feed' && tubeFeedResult) {
			return tubeFeedResult.capsulesPerDay;
		}
		return null;
	});

	let heroUnit = $derived(
		pertState.current.mode === 'tube-feed' ? 'capsules/day' : 'capsules/dose'
	);

	let modeQualifier = $derived(
		pertState.current.mode === 'tube-feed' ? 'Tube-feed dose' : 'Oral dose'
	);

	let emptyMessage = $derived(
		pertState.current.mode === 'tube-feed'
			? validationMessages.emptyTubeFeed
			: validationMessages.emptyOral
	);

	// pulseKey: empty-${mode} when no result; ${mode}-${capsules} when computed.
	// HeroResult fires its 200ms pulse on key change (reduced-motion respected).
	let pulseKey = $derived.by(() => {
		if (heroValue === null) return `empty-${pertState.current.mode}`;
		return `${pertState.current.mode}-${heroValue}`;
	});

	// Persist on any state change (D-07; same shape as Phase 1 placeholder).
	$effect(() => {
		JSON.stringify(pertState.current);
		pertState.persist();
	});
</script>

<div class="space-y-6">
	<!-- HERO: empty state OR computed capsules numeral. The children-snippet escape
	     hatch keeps the Phase 1 promoted PERT eyebrow + mode qualifier shape and
	     adds the text-display numeral row when valid. Identity-purple stays on the
	     eyebrow per Identity-Inside Rule; numeral uses text-text-primary. -->
	<HeroResult
		eyebrow="PERT"
		value={heroValue !== null ? String(heroValue) : ''}
		{pulseKey}
		ariaLabel="PERT capsule dose"
		numericValue={heroValue}
	>
		{#snippet children()}
			<div class="flex flex-col gap-2">
				<div class="flex items-baseline gap-3">
					<span
						class="text-title font-black tracking-tight text-[var(--color-identity)] uppercase"
					>
						PERT
					</span>
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase"
					>
						{modeQualifier}
					</span>
				</div>
				{#if heroValue !== null}
					<div class="flex items-baseline gap-2">
						<span class="num text-display font-black text-[var(--color-text-primary)]">
							{heroValue}
						</span>
						<span class="text-ui font-medium text-[var(--color-text-secondary)]">
							{heroUnit}
						</span>
					</div>
				{:else}
					<p class="text-ui text-[var(--color-text-secondary)]">{emptyMessage}</p>
				{/if}
			</div>
		{/snippet}
	</HeroResult>

	<!-- SECONDARY OUTPUTS: visible only when a valid result exists (D-08 hides
	     on empty). Eyebrows carry identity-purple; numerals use text-text-primary
	     per Eyebrow-Above-Numeral Rule. All numerals get class="num" for tabular
	     figures (DESIGN.md Tabular-Numbers). -->
	{#if pertState.current.mode === 'oral' && oralResult}
		<section class="card">
			<div class="flex flex-col divide-y divide-[var(--color-border)]">
				<!-- Total lipase needed -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							Total lipase needed
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-bold text-[var(--color-text-primary)]">
								{oralResult.totalLipase.toLocaleString('en-US')}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">units/dose</span>
						</div>
					</div>
				</div>

				<!-- Lipase per dose -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							Lipase per dose
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-bold text-[var(--color-text-primary)]">
								{oralResult.lipasePerDose.toLocaleString('en-US')}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">units/dose</span>
						</div>
					</div>
				</div>

				<!-- Tertiary line per D-09 verbatim.
				     text-2xs eyebrow + text-base value (smaller than secondaries). -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							Estimated daily total (3 meals/day)
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-base font-medium text-[var(--color-text-primary)]">
								{oralResult.estimatedDailyTotal}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">capsules</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	{:else if pertState.current.mode === 'tube-feed' && tubeFeedResult}
		<section class="card">
			<div class="flex flex-col divide-y divide-[var(--color-border)]">
				<!-- Total fat -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							Total fat
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-bold text-[var(--color-text-primary)]">
								{tubeFeedResult.totalFatG.toFixed(1)}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">g/day</span>
						</div>
					</div>
				</div>

				<!-- Total lipase needed -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							Total lipase needed
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-bold text-[var(--color-text-primary)]">
								{tubeFeedResult.totalLipase.toLocaleString('en-US')}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">units/day</span>
						</div>
					</div>
				</div>

				<!-- Lipase per kg -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
						>
							Lipase per kg
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-bold text-[var(--color-text-primary)]">
								{Math.round(tubeFeedResult.lipasePerKg).toLocaleString('en-US')}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">units/kg/day</span>
						</div>
					</div>
				</div>

				<!-- Capsules per month (F-03 + Approach C escalation: extra-bold numeral + wider eyebrow letter-spacing to elevate prescribing artifact above derived siblings; Identity-Inside preserved). -->
				<div class="flex items-baseline justify-between px-5 py-4">
					<div>
						<div
							class="text-2xs font-semibold tracking-wider text-[var(--color-identity)] uppercase"
						>
							Capsules per month
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-title font-extrabold text-[var(--color-text-primary)]">
								{tubeFeedResult.capsulesPerMonth.toLocaleString('en-US')}
							</span>
							<span class="text-ui text-[var(--color-text-secondary)]">capsules</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- STOP-RED ADVISORIES per D-04 + D-20 + UI-SPEC. The 2px error border + bold
	     red message + OctagonAlert icon escalates visual weight for the FDA
	     10,000 units/kg/day cap (PERT-SAFE-01, the ONE Red-Means-Wrong carve-out
	     for this calculator). The alert role plus assertive live region interrupt
	     the polite hero region for clinical urgency. -->
	{#each stopAdvisories as advisory (advisory.id)}
		<section
			class="flex items-start gap-3 rounded-xl border-2 border-[var(--color-error)] bg-[var(--color-surface-card)] px-4 py-3"
			role="alert"
			aria-live="assertive"
		>
			<OctagonAlert
				size={20}
				class="mt-0.5 shrink-0 text-[var(--color-error)]"
				aria-hidden="true"
			/>
			<p class="text-ui font-bold text-[var(--color-error)]">{advisory.message}</p>
		</section>
	{/each}

	<!-- NEUTRAL WARNING ADVISORIES: mirrors FeedAdvanceCalculator.svelte:311-322.
	     Neutral surface + AlertTriangle + secondary-text icon + primary-text
	     message. The note role applies (no live region; warnings don't interrupt). -->
	{#each warningAdvisories as advisory (advisory.id)}
		<div
			class="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3"
			role="note"
		>
			<AlertTriangle
				size={20}
				class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
				aria-hidden="true"
			/>
			<p class="text-ui font-semibold text-[var(--color-text-primary)]">{advisory.message}</p>
		</div>
	{/each}
</div>
