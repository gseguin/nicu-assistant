<script lang="ts">
	import { calculateUacUvc } from './calculations.js';
	import { uacUvcState } from './state.svelte.js';
	import NumericInput from '$lib/shared/components/NumericInput.svelte';
	import config from './uac-uvc-config.json';
	import type { UacUvcInputRanges } from './types.js';
	import { ArrowDownToLine, ArrowUpFromLine } from '@lucide/svelte';

	const inputs = config.inputs as UacUvcInputRanges;

	let result = $derived(calculateUacUvc(uacUvcState.current));
	let pulseKey = $derived(uacUvcState.current.weightKg?.toFixed(2) ?? '');

	// Persist on change — mirrors GirCalculator.svelte pattern exactly
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
		<input
			type="range"
			min={inputs.weightKg.min}
			max={inputs.weightKg.max}
			step={inputs.weightKg.step}
			value={uacUvcState.current.weightKg ?? inputs.weightKg.min}
			oninput={(e) =>
				(uacUvcState.current.weightKg = parseFloat((e.currentTarget as HTMLInputElement).value))}
			aria-label="Weight slider"
			class="range-uac mt-2 w-full"
		/>
	</section>

	<!-- HERO GRID: UAC first (top stripe), UVC second (bottom stripe). Stack on mobile, side-by-side on md+. -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- UAC HERO CARD -->
		{#key pulseKey}
			<section
				class="card animate-result-pulse border-t-4 px-5 py-5"
				style="background: var(--color-identity-hero); border-top-color: var(--color-identity);"
				aria-live="polite"
				aria-atomic="true"
			>
				{#if result}
					<div class="flex flex-col gap-3">
						<div class="flex items-center gap-2">
							<ArrowDownToLine
								size={24}
								class="text-[var(--color-identity)]"
								aria-hidden="true"
							/>
							<div
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								UAC DEPTH — ARTERIAL
							</div>
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-display font-black text-[var(--color-text-primary)]"
								>{result.uacCm.toFixed(1)}</span
							>
							<span class="text-ui text-[var(--color-text-secondary)]">cm</span>
						</div>
					</div>
				{:else}
					<p class="text-ui text-[var(--color-text-secondary)]">
						Enter weight to compute depth
					</p>
				{/if}
			</section>
		{/key}

		<!-- UVC HERO CARD -->
		{#key pulseKey}
			<section
				class="card animate-result-pulse border-b-4 px-5 py-5"
				style="background: var(--color-identity-hero); border-bottom-color: var(--color-identity);"
				aria-live="polite"
				aria-atomic="true"
			>
				{#if result}
					<div class="flex flex-col gap-3">
						<div class="flex items-center gap-2">
							<ArrowUpFromLine
								size={24}
								class="text-[var(--color-identity)]"
								aria-hidden="true"
							/>
							<div
								class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
							>
								UVC DEPTH — VENOUS
							</div>
						</div>
						<div class="flex items-baseline gap-2">
							<span class="num text-display font-black text-[var(--color-text-primary)]"
								>{result.uvcCm.toFixed(1)}</span
							>
							<span class="text-ui text-[var(--color-text-secondary)]">cm</span>
						</div>
					</div>
				{:else}
					<p class="text-ui text-[var(--color-text-secondary)]">
						Enter weight to compute depth
					</p>
				{/if}
			</section>
		{/key}
	</div>
</div>

<style>
	.range-uac {
		accent-color: var(--color-identity);
		min-height: 48px;
		touch-action: manipulation;
		width: 100%;
	}
</style>
