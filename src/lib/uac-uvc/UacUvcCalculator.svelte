<script lang="ts">
	import { calculateUacUvc } from './calculations.js';
	import { uacUvcState } from './state.svelte.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';
	import config from './uac-uvc-config.json';
	import type { UacUvcInputRanges } from './types.js';
	import { Slider } from 'bits-ui';

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

	<!-- HERO GRID: UAC + UVC side-by-side on md+, stacked on mobile.
	     "UAC" / "UVC" promoted as large identity-colored labels;
	     "Arterial" / "Venous" qualifier sits as a quieter secondary line. -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<HeroResult
			eyebrow="UAC"
			value={result ? result.uacCm.toFixed(1) : ''}
			unit={result ? 'cm' : undefined}
			pulseKey={result ? pulseKey : 'empty-uac'}
			ariaLabel="UAC depth, arterial"
		>
			{#snippet children()}
				<div class="flex flex-col gap-2">
					<div class="flex items-baseline gap-3">
						<span
							class="text-title font-black tracking-tight text-[var(--color-identity)] uppercase"
						>
							UAC
						</span>
						<span
							class="text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase"
						>
							Arterial depth
						</span>
					</div>
					{#if result}
						<div class="flex items-baseline gap-2">
							<span class="num text-display font-black text-[var(--color-text-primary)]">
								{result.uacCm.toFixed(1)}
							</span>
							<span class="text-ui font-medium text-[var(--color-text-secondary)]">cm</span>
						</div>
					{:else}
						<p class="text-ui text-[var(--color-text-secondary)]">
							Enter weight to compute depth
						</p>
					{/if}
				</div>
			{/snippet}
		</HeroResult>
		<HeroResult
			eyebrow="UVC"
			value={result ? result.uvcCm.toFixed(1) : ''}
			unit={result ? 'cm' : undefined}
			pulseKey={result ? pulseKey : 'empty-uvc'}
			ariaLabel="UVC depth, venous"
		>
			{#snippet children()}
				<div class="flex flex-col gap-2">
					<div class="flex items-baseline gap-3">
						<span
							class="text-title font-black tracking-tight text-[var(--color-identity)] uppercase"
						>
							UVC
						</span>
						<span
							class="text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase"
						>
							Venous depth
						</span>
					</div>
					{#if result}
						<div class="flex items-baseline gap-2">
							<span class="num text-display font-black text-[var(--color-text-primary)]">
								{result.uvcCm.toFixed(1)}
							</span>
							<span class="text-ui font-medium text-[var(--color-text-secondary)]">cm</span>
						</div>
					{:else}
						<p class="text-ui text-[var(--color-text-secondary)]">
							Enter weight to compute depth
						</p>
					{/if}
				</div>
			{/snippet}
		</HeroResult>
	</div>
</div>

