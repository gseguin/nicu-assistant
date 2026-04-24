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
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import { uacUvcState } from '$lib/uac-uvc/state.svelte.js';
	import config from '$lib/uac-uvc/uac-uvc-config.json';
	import type { UacUvcInputRanges } from '$lib/uac-uvc/types.js';
	import { Slider } from 'bits-ui';

	const inputs = config.inputs as UacUvcInputRanges;

	// bits-ui Slider binds a number; we mirror it to/from the nullable state field.
	let sliderValue = $derived(uacUvcState.current.weightKg ?? inputs.weightKg.min);
	function onSliderChange(v: number) {
		uacUvcState.current.weightKg = v;
	}

	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(uacUvcState.current);
		uacUvcState.persist();
	});
</script>

<section class="card flex flex-col gap-4">
	<NumericInput
		bind:value={uacUvcState.current.weightKg}
		label="Weight"
		suffix="kg"
		min={inputs.weightKg.min}
		max={inputs.weightKg.max}
		step={inputs.weightKg.step}
		placeholder="2.5"
		id="uac-weight"
		showRangeHint={true}
		showRangeError={true}
	/>
	<Slider.Root
		type="single"
		value={sliderValue}
		onValueChange={onSliderChange}
		min={inputs.weightKg.min}
		max={inputs.weightKg.max}
		step={inputs.weightKg.step}
		class="slider-root relative mt-1 flex h-12 w-full touch-none items-center select-none"
	>
		<span
			class="relative h-1.5 w-full grow overflow-hidden rounded-full"
			style="background: var(--color-identity-hero);"
		>
			<Slider.Range
				class="absolute h-full rounded-full"
				style="background: var(--color-identity);"
			/>
		</span>
		<Slider.Thumb
			index={0}
			aria-label="Weight slider"
			class="block h-6 w-6 rounded-full border-2 bg-[var(--color-surface)] shadow-md transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-110"
			style="border-color: var(--color-identity); --tw-ring-color: var(--color-identity); --tw-ring-offset-color: var(--color-surface);"
		/>
	</Slider.Root>
</section>
