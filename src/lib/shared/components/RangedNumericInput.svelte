<!--
  src/lib/shared/components/RangedNumericInput.svelte

  Unified numeric input UX across every calculator with a defined min/max range.
  Wraps <NumericInput> (textbox) + <Slider.Root> (bits-ui Slider) bidirectionally
  synced to the same bound value. Adding or removing the slider is a single-prop
  change at the call-site.

  Contract (locked 2026-04-24 post-42.1 critique follow-up):
  - textbox and slider bind to the same value
  - slider disabled when value is null (no sensible thumb position); hidden only
    if the caller explicitly passes showSlider={false}
  - tight gap between textbox and slider (8 px / gap-2) — no `mt-*` on the slider
  - slider inherits identity color (`var(--color-identity)`) per Identity-Inside Rule
  - 48 px touch target on the slider thumb (h-12 on Slider.Root, h-6 w-6 on Thumb)

  Use this instead of bare <NumericInput> whenever min + max + step are defined
  and the clinician benefits from a coarse drag control alongside the textbox.
-->
<script lang="ts">
	import NumericInput from './NumericInput.svelte';
	import { Slider } from 'bits-ui';

	let {
		value = $bindable(),
		label = '',
		placeholder = '',
		suffix = '',
		error = '',
		min,
		max,
		step = 0.1,
		showRangeHint = true,
		showRangeError = true,
		showSlider = true,
		sliderAriaLabel,
		id
	} = $props<{
		value: number | null;
		label?: string;
		placeholder?: string;
		suffix?: string;
		error?: string;
		min: number;
		max: number;
		step?: number;
		showRangeHint?: boolean;
		showRangeError?: boolean;
		showSlider?: boolean;
		sliderAriaLabel?: string;
		id?: string;
	}>();

	// bits-ui Slider binds a number; we mirror it to/from the nullable state field.
	// When value is null, snap the slider to min so the thumb sits at a sensible start.
	let sliderValue = $derived(value ?? min);
	function onSliderChange(v: number) {
		value = v;
	}

	let effectiveSliderAriaLabel = $derived(sliderAriaLabel ?? `${label} slider`);
</script>

<div class="flex flex-col gap-2">
	<NumericInput
		bind:value
		{label}
		{placeholder}
		{suffix}
		{error}
		{min}
		{max}
		{step}
		{showRangeHint}
		{showRangeError}
		{id}
	/>
	{#if showSlider}
		<Slider.Root
			type="single"
			value={sliderValue}
			onValueChange={onSliderChange}
			{min}
			{max}
			{step}
			class="slider-root relative flex h-12 w-full touch-none items-center select-none"
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
				aria-label={effectiveSliderAriaLabel}
				class="block h-6 w-6 rounded-full border-2 bg-[var(--color-surface)] shadow-md transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-110"
				style="border-color: var(--color-identity); --tw-ring-color: var(--color-identity); --tw-ring-offset-color: var(--color-surface);"
			/>
		</Slider.Root>
	{/if}
</div>
