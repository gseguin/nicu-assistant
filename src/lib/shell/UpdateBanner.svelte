<!-- D-03: minimal update notification — not modal, not blocking -->
<script lang="ts">
  import { pwa } from '$lib/shared/pwa.svelte.js';
</script>

{#if pwa.needsRefresh}
  <div
    role="status"
    aria-live="polite"
    class="
      fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] left-0 right-0
      md:bottom-auto md:top-14
      flex items-center justify-between gap-3
      px-4 py-2.5
      bg-surface-card border-t border-border
      text-text-secondary text-sm
      z-40
      shadow-md
    "
  >
    <span>A newer version is available.</span>
    <button
      onclick={() => pwa.applyUpdate()}
      class="
        text-accent font-semibold text-sm
        min-h-[48px] px-4
        rounded-lg
        hover:bg-surface-card
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        transition-colors
      "
    >
      Update now
    </button>
  </div>
{/if}
