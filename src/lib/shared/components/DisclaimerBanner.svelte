<script lang="ts">
	import { X } from '@lucide/svelte';
	import { disclaimer } from '$lib/shared/disclaimer.svelte.js';

	let { onShowFull }: { onShowFull?: () => void } = $props();
</script>

{#if disclaimer.initialized && !disclaimer.acknowledged}
	<div
		role="region"
		aria-label="Clinical use disclaimer"
		class="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-ui"
	>
		<p class="flex-1 text-[var(--color-text-primary)]">
			Clinical decision support, not medical advice. Verify all values before clinical use.
			<button
				type="button"
				class="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
				onclick={onShowFull}>More</button
			>
		</p>
		<button
			type="button"
			class="icon-btn min-h-[48px] min-w-[48px]"
			aria-label="Dismiss disclaimer"
			onclick={() => disclaimer.acknowledge()}
		>
			<X size={18} aria-hidden="true" />
		</button>
	</div>
{/if}
