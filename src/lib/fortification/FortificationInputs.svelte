<!--
  src/lib/fortification/FortificationInputs.svelte

  Inputs-only fragment extracted from FortificationCalculator (Plan 42.1-05 / D-08).
  The route composes this either inside the desktop sticky right column or inside the
  mobile <InputDrawer>. The calculator itself owns the hero + verification region.

  No own state — values flow through the fortificationState singleton, identical to
  the previous inline inputs section. The same string-bridge mirror pattern is used
  for the SelectPicker bindings (which require $state'd strings).
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import {
		formulaSupportsPackets,
		getFortificationFormulas,
		inputs
	} from '$lib/fortification/fortification-config.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
	import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
	import type { SelectOption } from '$lib/shared/types.js';
	import type { BaseType, UnitType, TargetKcalOz } from './types.js';

	// --- String-bridge mirrors for SelectPicker (locked approach) -----------
	let kcalStr = $state(String(fortificationState.current.targetKcalOz));
	let baseStr = $state<string>(fortificationState.current.base);
	let formulaStr = $state<string>(fortificationState.current.formulaId);
	let unitStr = $state<string>(fortificationState.current.unit);

	// Mirror -> state (user input flows down to state). One effect per mirror so
	// that a change to one mirror does not cause stale writes of the others.
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

	// State -> mirrors (external changes flow up to mirrors). Equality guards prevent ping-pong.
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

	// --- Auto-reset on similac-hmf -> non-HMF transition while packets selected.
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

	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(fortificationState.current);
		fortificationState.persist();
	});
</script>

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
