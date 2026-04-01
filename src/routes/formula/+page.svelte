<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { formulaState } from '$lib/formula/state.svelte.js';
  import FormulaCalculator from '$lib/formula/FormulaCalculator.svelte';
  import { Milk } from '@lucide/svelte';

  onMount(() => {
    setCalculatorContext({
      id: 'formula',
      accentColor: 'var(--color-accent)'
    });
    formulaState.init();
  });
</script>

<svelte:head>
  <title>Formula Recipe | NICU Assistant</title>
</svelte:head>

<div class="max-w-lg mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <Milk size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
    <h1 class="text-title font-bold text-[var(--color-text-primary)]">Formula Recipe</h1>
  </header>

  <FormulaCalculator />
</div>
