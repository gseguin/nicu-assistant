<script lang="ts">
	import { calculateFortification } from '$lib/fortification/calculations.js';
	import {
		formulaSupportsPackets,
		getFormulaById,
		getFortificationFormulas,
		inputs
	} from '$lib/fortification/fortification-config.js';
	import { untrack } from 'svelte';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
	import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import type { SelectOption } from '$lib/shared/types.js';
	import type { BaseType, UnitType, TargetKcalOz } from './types.js';

	// --- String-bridge mirrors for SelectPicker (locked approach) -----------
	let kcalStr = $state(String(fortificationState.current.targetKcalOz));
	let baseStr = $state<string>(fortificationState.current.base);
	let formulaStr = $state<string>(fortificationState.current.formulaId);
	let unitStr = $state<string>(fortificationState.current.unit);

	// Mirror → state (user input flows down to state). One effect per mirror so
	// that a change to one mirror does not cause stale writes of the others.
	// State reads are untracked so external state mutations never re-trigger
	// these effects (which would clobber state with a stale mirror value).
	$effect(() => {
		const k = kcalStr;
		untrack(() => {
			const nextKcal = parseInt(k, 10) as TargetKcalOz;
			if (fortificationState.current.targetKcalOz !== nextKcal) {
				fortificationState.current.targetKcalOz = nextKcal;
			}
		});
	});
	$effect(() => {
		const b = baseStr;
		untrack(() => {
			if (fortificationState.current.base !== b) {
				fortificationState.current.base = b as BaseType;
			}
		});
	});
	$effect(() => {
		const f = formulaStr;
		untrack(() => {
			if (fortificationState.current.formulaId !== f) {
				fortificationState.current.formulaId = f;
			}
		});
	});
	$effect(() => {
		const u = unitStr;
		untrack(() => {
			if (fortificationState.current.unit !== u) {
				fortificationState.current.unit = u as UnitType;
			}
		});
	});

	// State → mirrors (external changes flow up to mirrors). Equality guards prevent ping-pong.
	$effect(() => {
		const s = fortificationState.current;
		if (kcalStr !== String(s.targetKcalOz)) kcalStr = String(s.targetKcalOz);
		if (baseStr !== s.base) baseStr = s.base;
		if (formulaStr !== s.formulaId) formulaStr = s.formulaId;
		if (unitStr !== s.unit) unitStr = s.unit;
	});

	// --- Option lists --------------------------------------------------------
	const baseOptions: SelectOption[] = [
		{ value: 'breast-milk', label: 'Breast milk' },
		{ value: 'water', label: 'Water' }
	];

	const formulaOptions: SelectOption[] = getFortificationFormulas()
		.slice()
		.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name))
		.map((f) => ({ value: f.id, label: f.name, group: f.manufacturer }));

	const kcalOptions: SelectOption[] = [
		{ value: '22', label: '22 kcal/oz' },
		{ value: '24', label: '24 kcal/oz' },
		{ value: '26', label: '26 kcal/oz' },
		{ value: '28', label: '28 kcal/oz' },
		{ value: '30', label: '30 kcal/oz' }
	];

	const UNIT_LABELS: Record<UnitType, string> = {
		grams: 'Grams',
		scoops: 'Scoops',
		teaspoons: 'Teaspoons',
		tablespoons: 'Tablespoons',
		packets: 'Packets'
	};

	// --- Unit options: Packets is only available for Similac HMF ------------
	let unitOptions = $derived.by<SelectOption[]>(() => {
		const base: SelectOption[] = [
			{ value: 'grams', label: 'Grams' },
			{ value: 'scoops', label: 'Scoops' },
			{ value: 'teaspoons', label: 'Teaspoons' },
			{ value: 'tablespoons', label: 'Tablespoons' }
		];
		if (formulaSupportsPackets(fortificationState.current.formulaId)) {
			base.push({ value: 'packets', label: 'Packets' });
		}
		return base;
	});

	// --- Auto-reset on similac-hmf → non-HMF transition while packets selected.
	// Without this, switching formula away from HMF would leave the state with
	// an invalid unit that no longer appears in the picker.
	let prevFormulaId = fortificationState.current.formulaId;
	$effect(() => {
		const currFormulaId = fortificationState.current.formulaId;
		const currUnit = fortificationState.current.unit;
		if (prevFormulaId !== currFormulaId) {
			// v1.3 reset: leaving a packets-capable formula while packets selected
			if (
				formulaSupportsPackets(prevFormulaId) &&
				!formulaSupportsPackets(currFormulaId) &&
				currUnit === 'packets'
			) {
				fortificationState.current.unit = 'teaspoons';
			}
			// v1.7 AUTO-01..04: entering a packets-capable formula auto-selects packets
			if (!formulaSupportsPackets(prevFormulaId) && formulaSupportsPackets(currFormulaId)) {
				fortificationState.current.unit = 'packets';
			}
		}
		prevFormulaId = currFormulaId;
	});

	// --- Result derivation --------------------------------------------------
	let result = $derived.by(() => {
		const { base, volumeMl, formulaId, targetKcalOz, unit } = fortificationState.current;
		if (volumeMl === null || volumeMl <= 0) return null;
		const formula = getFormulaById(formulaId);
		if (!formula) return null;
		return calculateFortification({ formula, base, volumeMl, targetKcalOz, unit });
	});

	let unitLabel = $derived(UNIT_LABELS[unitStr as UnitType] ?? '');

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

	// Persist on any state change (mirror morphine)
	$effect(() => {
		JSON.stringify(fortificationState.current);
		fortificationState.persist();
	});
</script>

<div class="space-y-6">
	<!-- Inputs Card -->
	<section class="card flex flex-col gap-4">
		<SegmentedToggle label="Base" bind:value={baseStr} options={baseOptions} />

		<div class="flex items-end gap-3">
			<div class="min-w-0 flex-1">
				<SelectPicker label="Formula" bind:value={formulaStr} options={formulaOptions} searchable />
			</div>
			<div class="shrink-0 basis-28">
				<NumericInput
					bind:value={fortificationState.current.volumeMl}
					label="Starting Volume"
					suffix="mL"
					min={inputs.volumeMl.min}
					max={inputs.volumeMl.max}
					step={inputs.volumeMl.step}
					showRangeHint={false}
					showRangeError={false}
					placeholder="180"
					id="fortification-volume"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<SelectPicker label="Target Calorie" bind:value={kcalStr} options={kcalOptions} />
			<SelectPicker label="Unit" bind:value={unitStr} options={unitOptions} />
		</div>
	</section>

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
