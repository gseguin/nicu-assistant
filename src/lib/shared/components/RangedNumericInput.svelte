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
		typeStep,
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
		// Typing-precision override. Slider + wheel still nudge at `step`, but
		// the textbox accepts values at `typeStep` resolution. Use for weight
		// (drag in 0.5 kg steps, type 2.37 kg precision).
		typeStep?: number;
		showRangeHint?: boolean;
		showRangeError?: boolean;
		showSlider?: boolean;
		sliderAriaLabel?: string;
		id?: string;
	}>();

	// bits-ui Slider mirrors `value` into [min, max] at `step` resolution. Two
	// problems this code solves:
	//   1. Typed values may be null, out-of-range, or not on a step boundary
	//      (user typing "3" on its way to "0.3", or 2.37 kg with a 0.5 slider
	//      step). Round the fed value to the slider grid so bits-ui receives
	//      an aligned mirror and never needs to round.
	//   2. Even with an aligned mirror, bits-ui fires onValueChange on the
	//      initial mount. Track whether the slider thumb has actually been
	//      touched by the user (pointer / key) — while untouched, onValueChange
	//      is treated as programmatic-echo and ignored.
	let sliderInteracted = $state(false);
	function clamp(n: number) {
		if (n < min) return min;
		if (n > max) return max;
		return n;
	}
	function toStepGrid(n: number) {
		// Round to nearest step, anchored at min.
		const k = Math.round((n - min) / step);
		return min + k * step;
	}
	let sliderValue = $derived.by(() => {
		if (value === null) return min;
		return toStepGrid(clamp(value));
	});
	function onSliderChange(v: number) {
		// Only accept writes from genuine user interaction. Suppresses the
		// clamp/round echo that bits-ui emits when we feed it an out-of-grid
		// textbox value.
		if (!sliderInteracted) return;
		// Also skip writes that match our fed mirror exactly — those are
		// idempotent echoes that would overwrite finer textbox precision
		// (e.g. 2.37 kg → mirror 2.5 → echo 2.5 → value becomes 2.5).
		if (v === sliderValue && value !== null && v !== value) return;
		value = v;
	}
	function markInteracted() {
		sliderInteracted = true;
	}

	let effectiveSliderAriaLabel = $derived(sliderAriaLabel ?? `${label} slider`);

	// Thumb DOM ref — used to override bits-ui's internal tabindex=0 with -1
	// so the iOS keyboard accessory-bar prev/next form-field chain skips it.
	// bits-ui's props-merge order overwrites a tabindex prop, so we mutate
	// the rendered attribute post-mount instead.
	let thumbEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (thumbEl) thumbEl.tabIndex = -1;
	});
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
		{typeStep}
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
			onpointerdown={markInteracted}
			onkeydown={markInteracted}
			onfocusin={markInteracted}
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
			<!-- bind:ref + post-mount tabindex=-1: removes the thumb from the iOS
			     keyboard accessory-bar prev/next form-field chain (a non-form-control
			     with tabindex=0 was disabling the chain or making it skip adjacent
			     inputs). bits-ui sets tabindex=0 internally via its props-merge
			     order, so passing tabindex={-1} as a prop is overwritten — we
			     mutate the DOM attribute directly after mount instead. The paired
			     NumericInput above is the canonical keyboard entry point; touch
			     drag is unaffected. -->
			<Slider.Thumb
				bind:ref={thumbEl}
				index={0}
				aria-label={effectiveSliderAriaLabel}
				class="block h-6 w-6 rounded-full border-2 bg-[var(--color-surface)] shadow-md transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-110"
				style="border-color: var(--color-identity); --tw-ring-color: var(--color-identity); --tw-ring-offset-color: var(--color-surface);"
			/>
		</Slider.Root>
	{/if}
</div>
