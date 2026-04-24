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
		children
	}: {
		eyebrow: string;
		value: string;
		unit?: string;
		secondary?: string | Snippet;
		pulseKey?: string | number;
		icon?: Component;
		ariaLabel?: string;
		children?: Snippet;
	} = $props();
</script>

<section
	class="card animate-result-pulse px-5 py-5"
	style="background: var(--color-identity-hero);"
	aria-live="polite"
	aria-atomic="true"
	aria-label={ariaLabel}
>
	{#key pulseKey}
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
	{/key}
</section>
