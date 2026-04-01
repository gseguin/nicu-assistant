<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { pertState } from '$lib/pert/state.svelte.js';
  import DosingCalculator from '$lib/pert/DosingCalculator.svelte';
  import { FlaskConical } from '@lucide/svelte';

  onMount(() => {
    setCalculatorContext({
      id: 'pert',
      accentColor: 'var(--color-accent)'
    });
    pertState.init();
  });
</script>

<svelte:head>
  <title>PERT Dosing | NICU Assistant</title>
</svelte:head>

<div class="max-w-lg mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <FlaskConical size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
    <h1 class="text-title font-bold text-[var(--color-text-primary)]">PERT Dosing</h1>
  </header>

  <DosingCalculator />
</div>
