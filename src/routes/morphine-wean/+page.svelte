<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { morphineState } from '$lib/morphine/state.svelte.js';
  import MorphineWeanCalculator from '$lib/morphine/MorphineWeanCalculator.svelte';
  import { Syringe } from '@lucide/svelte';

  onMount(() => {
    setCalculatorContext({
      id: 'morphine-wean',
      accentColor: 'var(--color-accent)'
    });
    morphineState.init();
  });
</script>

<svelte:head>
  <title>Morphine Wean | NICU Assistant</title>
</svelte:head>

<div class="max-w-lg mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <Syringe size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
    <h1 class="text-title font-bold text-[var(--color-text-primary)]">Morphine Wean</h1>
  </header>

  <MorphineWeanCalculator />
</div>
