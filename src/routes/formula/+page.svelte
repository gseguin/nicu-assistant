<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { formulaState } from '$lib/formula/state.svelte.js';
  import FormulaCalculator from '$lib/formula/FormulaCalculator.svelte';
  import { theme } from '$lib/shared/theme.svelte.js';
  import AboutSheet from '$lib/shared/components/AboutSheet.svelte';
  import { Milk, Info, Sun, Moon } from '@lucide/svelte';

  let aboutOpen = $state(false);

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

<div class="max-w-xl lg:max-w-2xl mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <Milk size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
    <h1 class="text-title font-bold text-[var(--color-text-primary)]">Formula Recipe</h1>
    <div class="flex-1"></div>
    <div class="flex items-center gap-1 md:hidden">
      <button type="button" class="icon-btn min-h-[48px] min-w-[48px]" aria-label="About this calculator" onclick={() => aboutOpen = true}>
        <Info size={20} aria-hidden="true" />
      </button>
      <button type="button" class="icon-btn min-h-[48px] min-w-[48px]" aria-label={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onclick={() => theme.toggle()}>
        {#if theme.current === 'dark'}
          <Sun size={20} aria-hidden="true" />
        {:else}
          <Moon size={20} aria-hidden="true" />
        {/if}
      </button>
    </div>
  </header>

  <FormulaCalculator />
</div>

<AboutSheet calculatorId="formula" bind:open={aboutOpen} />
