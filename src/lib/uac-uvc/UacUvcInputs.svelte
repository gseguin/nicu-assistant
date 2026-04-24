<!--
  src/lib/uac-uvc/UacUvcInputs.svelte

  Inputs-only fragment extracted from UacUvcCalculator (Plan 42.1-05 / D-08).
  The route composes this either inside the desktop sticky right column or inside the
  mobile <InputDrawer>. The calculator itself owns the UAC + UVC hero grid only.

  Composition:
    - NumericInput textbox (Weight, kg)
    - bits-ui Slider (Weight, kg) — bidirectionally synced with the textbox
    Both controls bind to the same uacUvcState.current.weightKg via the same
    derived/onValueChange shape that the calculator previously used.

  Honors recent fixes:
    - b45ba06 — UAC/UVC labels promoted, no arrows (label markup unchanged here)
    - fbca33a — Slider aria-label moved to Thumb
-->
<script lang="ts">
	import RangedNumericInput from '$lib/shared/components/RangedNumericInput.svelte';
	import { uacUvcState } from '$lib/uac-uvc/state.svelte.js';
	import config from '$lib/uac-uvc/uac-uvc-config.json';
	import type { UacUvcInputRanges } from '$lib/uac-uvc/types.js';

	const inputs = config.inputs as UacUvcInputRanges;

	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(uacUvcState.current);
		uacUvcState.persist();
	});
</script>

<section class="card flex flex-col gap-4">
	<RangedNumericInput
		bind:value={uacUvcState.current.weightKg}
		label="Weight"
		suffix="kg"
		min={inputs.weightKg.min}
		max={inputs.weightKg.max}
		step={inputs.weightKg.step}
		typeStep={0.01}
		placeholder="3.0"
		id="uac-weight"
	/>
</section>
