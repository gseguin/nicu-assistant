<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { pertState } from '$lib/pert/state.svelte.js';
  import DosingCalculator from '$lib/pert/DosingCalculator.svelte';

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

<div class="max-w-md mx-auto px-4 py-6">
  <DosingCalculator />
</div>
