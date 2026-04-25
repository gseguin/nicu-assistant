<script lang="ts">
	import { pertState } from './state.svelte.js';
	import { validationMessages } from './config.js';
	import HeroResult from '$lib/shared/components/HeroResult.svelte';

	// Phase 1 placeholder: no calculation. Phase 2 (PERT-ORAL-* / PERT-TUBE-*) replaces
	// this body with capsules-per-dose / capsules-per-day math, the SegmentedToggle,
	// and the safety advisories. For now we just render the empty-state hero so the
	// /pert route is navigable and the identity hue is visible.

	let emptyMessage = $derived(
		pertState.current.mode === 'tube-feed'
			? validationMessages.emptyTubeFeed
			: validationMessages.emptyOral
	);
	let pulseKey = $derived(`empty-${pertState.current.mode}`);

	// Persist on any state change (defensive — also persisted from inputs in Phase 2).
	$effect(() => {
		JSON.stringify(pertState.current);
		pertState.persist();
	});
</script>

<div class="space-y-6">
	<HeroResult
		eyebrow="PERT"
		value=""
		{pulseKey}
		ariaLabel="PERT capsule dose"
		numericValue={null}
	>
		{#snippet children()}
			<div class="flex flex-col gap-2">
				<div class="flex items-baseline gap-3">
					<span
						class="text-title font-black tracking-tight text-[var(--color-identity)] uppercase"
					>
						PERT
					</span>
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase"
					>
						{pertState.current.mode === 'tube-feed' ? 'Tube-feed dose' : 'Oral dose'}
					</span>
				</div>
				<p class="text-ui text-[var(--color-text-secondary)]">{emptyMessage}</p>
			</div>
		{/snippet}
	</HeroResult>
</div>
