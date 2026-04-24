<script lang="ts">
	import { calculateUacUvc } from './calculations.js';
	import { uacUvcState } from './state.svelte.js';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';

	// Plan 42.1-05 (D-08): inputs (NumericInput textbox + bits-ui Slider, bidirectionally
	// synced) were extracted into UacUvcInputs.svelte so the route can place them in the
	// desktop sticky right column or the mobile <InputDrawer>. The calculator now renders
	// the UAC + UVC hero grid only — the result is the interface.

	let result = $derived(calculateUacUvc(uacUvcState.current));
	let pulseKey = $derived(uacUvcState.current.weightKg?.toFixed(2) ?? '');

	// Persist on change. Kept here so the calculator also persists when mounted
	// without the inputs fragment — defensive.
	$effect(() => {
		JSON.stringify(uacUvcState.current);
		uacUvcState.persist();
	});
</script>

<div class="space-y-6">
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
