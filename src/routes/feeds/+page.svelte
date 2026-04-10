<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { Baby } from '@lucide/svelte';

  onMount(() => {
    setCalculatorContext({
      id: 'feeds',
      accentColor: 'var(--color-identity)'
    });
  });
</script>

<svelte:head>
  <title>Feeds | NICU Assistant</title>
</svelte:head>

<div class="identity-feeds max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <Baby size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
    <div class="flex flex-col">
      <h1 class="text-title font-bold text-[var(--color-text-primary)]">Feed Advance Calculator</h1>
      <span class="text-ui text-[var(--color-text-secondary)]">coming soon</span>
    </div>
  </header>
</div>
