<script lang="ts">
	import { calculateUacUvc } from './calculations.js';
	import { uacUvcState } from './state.svelte.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import config from './uac-uvc-config.json';
	import type { UacUvcInputRanges } from './types.js';
	import { Slider } from 'bits-ui';
	import { ArrowDownToLine, ArrowUpFromLine } from '@lucide/svelte';

	const inputs = config.inputs as UacUvcInputRanges;

	// bits-ui Slider binds a number; we mirror it to/from the nullable state field.
	let sliderValue = $derived(uacUvcState.current.weightKg ?? inputs.weightKg.min);
	function onSliderChange(v: number) {
		uacUvcState.current.weightKg = v;
	}

	let result = $derived(calculateUacUvc(uacUvcState.current));
	let pulseKey = $derived(uacUvcState.current.weightKg?.toFixed(2) ?? '');

	// Persist on change: mirrors GirCalculator.svelte pattern exactly
	$effect(() => {
		JSON.stringify(uacUvcState.current);
		uacUvcState.persist();
	});
</script>

<div class="space-y-6">
	<!-- INPUTS CARD: NumericInput textbox + inline range slider, bidirectionally synced -->
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
			aria-label="Weight slider"
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
				class="block h-6 w-6 rounded-full border-2 bg-[var(--color-surface)] shadow-md transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-110"
				style="border-color: var(--color-identity); --tw-ring-color: var(--color-identity); --tw-ring-offset-color: var(--color-surface);"
			/>
		</Slider.Root>
	</section>

	<!-- HERO GRID: UAC + UVC side-by-side on md+, stacked on mobile.
	     Eyebrows use middle-dot U+00B7 (·) per em-dash ban (commit 917ecf2). -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#if result}
			<HeroResult
				eyebrow="UAC DEPTH · ARTERIAL"
				value={result.uacCm.toFixed(1)}
				unit="cm"
				icon={ArrowDownToLine}
				pulseKey={pulseKey}
			/>
			<HeroResult
				eyebrow="UVC DEPTH · VENOUS"
				value={result.uvcCm.toFixed(1)}
				unit="cm"
				icon={ArrowUpFromLine}
				pulseKey={pulseKey}
			/>
		{:else}
			<HeroResult eyebrow="UAC DEPTH · ARTERIAL" value="" pulseKey="empty-uac">
				{#snippet children()}
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<ArrowDownToLine
								size={24}
								class="text-[var(--color-identity)]"
								aria-hidden="true"
							/>
							<span
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								UAC DEPTH · ARTERIAL
							</span>
						</div>
						<p class="text-ui text-[var(--color-text-secondary)]">
							Enter weight to compute depth
						</p>
					</div>
				{/snippet}
			</HeroResult>
			<HeroResult eyebrow="UVC DEPTH · VENOUS" value="" pulseKey="empty-uvc">
				{#snippet children()}
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<ArrowUpFromLine
								size={24}
								class="text-[var(--color-identity)]"
								aria-hidden="true"
							/>
							<span
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								UVC DEPTH · VENOUS
							</span>
						</div>
						<p class="text-ui text-[var(--color-text-secondary)]">
							Enter weight to compute depth
						</p>
					</div>
				{/snippet}
			</HeroResult>
		{/if}
	</div>
</div>

