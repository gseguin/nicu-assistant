<script lang="ts">
  import ModifiedFormulaCalculator from '$lib/formula/ModifiedFormulaCalculator.svelte';
  import BreastMilkFortifierCalculator from '$lib/formula/BreastMilkFortifierCalculator.svelte';
  import { Baby, Milk } from '@lucide/svelte';
  import { formulaState } from '$lib/formula/state.svelte.js';

  // Persist state changes reactively
  $effect(() => {
    // Access the full state to track all changes
    JSON.stringify(formulaState.current);
    formulaState.persist();
  });

  function handleTabKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = formulaState.current.activeMode === 'modified' ? 'bmf' : 'modified';
      formulaState.current.activeMode = next;
      const tabId = next === 'modified' ? 'modified-tab' : 'bmf-tab';
      document.getElementById(tabId)?.focus();
    }
  }
</script>

<div class="space-y-6">
  <!-- Mode Switcher -->
  <div
    class="flex p-1 bg-[var(--color-surface-alt)] rounded-2xl shadow-inner border border-[var(--color-border)]"
    role="tablist"
    aria-label="Calculator Mode"
  >
    <button
      role="tab"
      aria-selected={formulaState.current.activeMode === 'modified'}
      aria-controls="modified-panel"
      id="modified-tab"
      tabindex={formulaState.current.activeMode === 'modified' ? 0 : -1}
      class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-ui outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-light)] {formulaState.current.activeMode === 'modified' ? 'bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)]'}"
      onclick={() => formulaState.current.activeMode = 'modified'}
      onkeydown={handleTabKeydown}
    >
      <Baby class="w-4 h-4" aria-hidden="true" />
      <span>Modified Formula</span>
    </button>
    <button
      role="tab"
      aria-selected={formulaState.current.activeMode === 'bmf'}
      aria-controls="bmf-panel"
      id="bmf-tab"
      tabindex={formulaState.current.activeMode === 'bmf' ? 0 : -1}
      class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-ui outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bmf-500)] {formulaState.current.activeMode === 'bmf' ? 'bg-[var(--color-surface-card)] text-[var(--color-bmf-600)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)]'}"
      onclick={() => formulaState.current.activeMode = 'bmf'}
      onkeydown={handleTabKeydown}
    >
      <Milk class="w-4 h-4" aria-hidden="true" />
      <span>Breast Milk Fortifier</span>
    </button>
  </div>

  <!-- Calculator Display -->
  <div
    id="modified-panel"
    role="tabpanel"
    aria-labelledby="modified-tab"
    hidden={formulaState.current.activeMode !== 'modified'}
  >
    {#if formulaState.current.activeMode === 'modified'}
      <ModifiedFormulaCalculator />
    {/if}
  </div>

  <div
    id="bmf-panel"
    role="tabpanel"
    aria-labelledby="bmf-tab"
    hidden={formulaState.current.activeMode !== 'bmf'}
  >
    {#if formulaState.current.activeMode === 'bmf'}
      <BreastMilkFortifierCalculator />
    {/if}
  </div>
</div>
