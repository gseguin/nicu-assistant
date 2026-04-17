<!-- D-03: minimal update notification — not modal, not blocking -->
<script lang="ts">
	import { pwa } from '$lib/shared/pwa.svelte.js';
</script>

{#if pwa.needsRefresh}
	<div
		role="status"
		aria-live="polite"
		class="
      fixed right-0 bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] left-0
      z-40 flex
      items-center justify-between gap-3 border-t
      border-border bg-surface-card
      px-4 py-2.5 text-sm
      text-text-secondary shadow-md
      md:top-14
      md:bottom-auto
    "
	>
		<span>A newer version is available.</span>
		<button
			onclick={() => pwa.applyUpdate()}
			class="
        min-h-[48px] rounded-lg px-4
        text-sm font-semibold
        text-accent
        transition-colors
        hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-accent
      "
		>
			Update now
		</button>
	</div>
{/if}
