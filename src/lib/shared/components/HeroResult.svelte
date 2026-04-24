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
