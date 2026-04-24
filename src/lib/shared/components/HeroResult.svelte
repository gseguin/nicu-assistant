<!--
  HeroResult — shared hero pattern for every calculator's primary result.

  Contract (locked 2026-04-24 post-42.1 critique):
  Any HeroResult must contain at least one `text-display` (44 px / font-black)
  element. The numeral is always the largest object on the card. Eyebrow,
  secondary lines, and labels may exist but must NOT compete with the
  display numeral for visual hierarchy.

  Default props (eyebrow + value + unit + optional secondary) render this
  contract automatically. When `children` snippet is used as an escape hatch
  for custom shapes (paired, metric-grid, label-promoted), the snippet MUST
  include at least one element with class="text-display" (or equivalent
  44 px size). See HeroResult.test.ts for enforcement scenarios.

  See DESIGN.md "Eyebrow-Above-Numeral Rule" + "The Hero Result (signature pattern)".
-->
<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	let {
		eyebrow,
		value,
		unit,
		secondary,
		pulseKey,
		icon: IconComponent,
		ariaLabel,
		numericValue,
		children
	}: {
		eyebrow: string;
		value: string;
		unit?: string;
		secondary?: string | Snippet;
		pulseKey?: string | number;
		icon?: Component;
		ariaLabel?: string;
		// Optional raw numeric of the primary result. When provided, the card
		// watches for ≥2× ratio changes between successive values and shows a
		// brief "Large change. Verify input." caption. Helps catch decimal-point
		// slips at the point of care. Pass null/undefined to skip the check
		// (calculators that have no single primary numeric).
		numericValue?: number | null;
		children?: Snippet;
	} = $props();

	// Track the previous stable numeric for ratio comparison. We compare the
	// incoming numericValue against the last-settled one — a ≥2× jump (or the
	// inverse, ≤0.5×) flips `largeChange` true for ~4 s. Nulls never trigger.
	let prevNumeric = $state<number | null>(null);
	let largeChange = $state(false);
	let changeResetTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	$effect(() => {
		const current = numericValue;
		const prev = prevNumeric;
		// Skip initial mount, nulls, zeros (can't ratio), and micro-changes.
		if (current === null || current === undefined || prev === null) {
			if (current !== null && current !== undefined) prevNumeric = current;
			return;
		}
		if (current === prev) return;
		if (prev === 0 || current === 0) {
			prevNumeric = current;
			return;
		}
		const ratio = current / prev;
		const isLarge = ratio >= 2 || ratio <= 0.5;
		prevNumeric = current;
		if (!isLarge) return;
		largeChange = true;
		if (changeResetTimer) clearTimeout(changeResetTimer);
		changeResetTimer = setTimeout(() => {
			largeChange = false;
			changeResetTimer = null;
		}, 4000);
	});

	// Pulse animation on recalc without a subtree remount. The old approach
	// ({#key pulseKey}) ripped out the inner DOM on every keystroke, losing
	// focus, selection, and scroll state inside the card. Now we toggle a
	// class on the inner wrapper instead: force-remove, reflow, force-add.
	// Reduced-motion users never see the animation (CSS guard in app.css).
	let pulseEl = $state<HTMLDivElement | null>(null);
	let lastPulseKey = $state<string | number | undefined>(undefined);
	$effect(() => {
		if (pulseKey === undefined || pulseKey === lastPulseKey) {
			if (pulseKey !== undefined) lastPulseKey = pulseKey;
			return;
		}
		lastPulseKey = pulseKey;
		const el = pulseEl;
		if (!el) return;
		el.classList.remove('animate-result-pulse');
		// Read offsetWidth to force a reflow so the animation restarts on
		// next class add; otherwise the same class re-added in the same tick
		// is a no-op and the animation doesn't fire.
		void el.offsetWidth;
		el.classList.add('animate-result-pulse');
	});
</script>

<section
	class="card px-5 py-5"
	style="background: var(--color-identity-hero);"
	aria-live="polite"
	aria-atomic="true"
	aria-label={ariaLabel}
>
	<div bind:this={pulseEl} class="animate-result-pulse">
		{#if children}
			{@render children()}
		{:else}
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					{#if IconComponent}
						<IconComponent
							size={24}
							class="text-[var(--color-identity)]"
							aria-hidden="true"
						/>
					{/if}
					<span
						class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
					>
						{eyebrow}
					</span>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="num text-display font-black text-[var(--color-text-primary)]">{value}</span>
					{#if unit}
						<span class="text-ui font-medium text-[var(--color-text-secondary)]">{unit}</span>
					{/if}
				</div>
				{#if secondary}
					{#if typeof secondary === 'string'}
						<span class="text-ui text-[var(--color-text-secondary)]">{secondary}</span>
					{:else}
						{@render secondary()}
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	{#if largeChange}
		<!-- Quiet, restrained change-warning. No red, no badge; identity-colored
		     caption sits below the hero numeral for ~4 s after a ≥2× ratio jump.
		     Catches decimal-point slips without turning the card into an alert. -->
		<p
			class="mt-3 border-t border-[var(--color-border)] pt-2 text-ui font-medium text-[var(--color-identity)]"
			aria-live="polite"
		>
			Large change. Verify input.
		</p>
	{/if}
</section>
