<script lang="ts">
  import { calculateLinearSchedule, calculateCompoundingSchedule } from '$lib/morphine/calculations.js';
  import { morphineState } from '$lib/morphine/state.svelte.js';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import type { WeanMode, WeanStep } from '$lib/morphine/types.js';

  const MODE_ORDER: WeanMode[] = ['linear', 'compounding'];
  const MODE_CONFIG: Record<WeanMode, { id: string; label: string }> = {
    linear: { id: 'linear', label: 'Linear' },
    compounding: { id: 'compounding', label: 'Compounding' },
  };

  function activateMode(mode: WeanMode) {
    morphineState.current.activeMode = mode;
  }

  function handleModeTabKeydown(event: KeyboardEvent, mode: WeanMode) {
    const currentIndex = MODE_ORDER.indexOf(mode);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % MODE_ORDER.length;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = (currentIndex - 1 + MODE_ORDER.length) % MODE_ORDER.length;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = MODE_ORDER.length - 1;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        activateMode(mode);
        return;
      default:
        return;
    }

    const nextMode = MODE_ORDER[nextIndex];
    activateMode(nextMode);
    document.getElementById(`${nextMode}-tab`)?.focus();
  }

  // Derived schedule computation
  let schedule: WeanStep[] = $derived.by(() => {
    const { weightKg, maxDoseMgKgDose, decreasePct, activeMode } = morphineState.current;
    if (weightKg === null || maxDoseMgKgDose === null || decreasePct === null) return [];
    if (weightKg <= 0 || maxDoseMgKgDose <= 0 || decreasePct <= 0) return [];
    const pct = decreasePct / 100; // convert from percentage integer to decimal
    if (activeMode === 'linear') {
      return calculateLinearSchedule(weightKg, maxDoseMgKgDose, pct);
    }
    return calculateCompoundingSchedule(weightKg, maxDoseMgKgDose, pct);
  });

  // Persist state on change
  $effect(() => {
    JSON.stringify(morphineState.current);
    morphineState.persist();
  });

  // Clear button visibility
  let hasValues = $derived(
    morphineState.current.weightKg !== null ||
    morphineState.current.maxDoseMgKgDose !== null ||
    morphineState.current.decreasePct !== null
  );

  function clearInputs() {
    morphineState.reset();
  }
</script>

<div class="space-y-6">
  <!-- Mode Switcher -->
  <div
    class="flex p-1 bg-[var(--color-surface-alt)] rounded-2xl shadow-inner border border-[var(--color-border)]"
    role="tablist"
    aria-label="Weaning mode"
  >
    {#each MODE_ORDER as mode}
      {@const cfg = MODE_CONFIG[mode]}
      <button
        role="tab"
        aria-selected={morphineState.current.activeMode === mode}
        aria-controls="{mode}-panel"
        id="{mode}-tab"
        tabindex={morphineState.current.activeMode === mode ? 0 : -1}
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-ui outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-light)] {morphineState.current.activeMode === mode ? 'bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)]'}"
        onclick={() => activateMode(mode)}
        onkeydown={(e) => handleModeTabKeydown(e, mode)}
      >
        <span>{cfg.label}</span>
      </button>
    {/each}
  </div>

  <!-- Inputs Card -->
  <section class="card flex flex-col gap-4">
    <NumericInput
      bind:value={morphineState.current.weightKg}
      label="Dosing weight"
      suffix="kg"
      min={0.1}
      max={200}
      step={0.1}
      placeholder="3.1"
      id="morphine-weight"
    />
    <NumericInput
      bind:value={morphineState.current.maxDoseMgKgDose}
      label="Max morphine dose"
      suffix="mg/kg/dose"
      min={0.001}
      max={1}
      step={0.001}
      placeholder="0.04"
      id="morphine-max-dose"
    />
    <NumericInput
      bind:value={morphineState.current.decreasePct}
      label="Decrease per step"
      suffix="%"
      min={1}
      max={50}
      step={1}
      placeholder="10"
      id="morphine-decrease"
    />
  </section>

  <!-- Tab Panels -->
  {#each MODE_ORDER as mode}
    <div
      role="tabpanel"
      id="{mode}-panel"
      aria-labelledby="{mode}-tab"
      hidden={morphineState.current.activeMode !== mode}
    >
      {#if morphineState.current.activeMode === mode}
        {#if schedule.length > 0}
          <section aria-label="Weaning schedule" aria-live="polite" aria-atomic="true">
            <div class="space-y-2">
              {#each schedule as step}
                <div class="card px-4 py-3 flex flex-col gap-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-[var(--color-text-secondary)]">Step {step.step}</span>
                    {#if step.reductionMg > 0}
                      <span class="text-xs font-medium text-[var(--color-error)]">-{step.reductionMg.toFixed(4)} mg</span>
                    {/if}
                  </div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-lg font-bold num text-[var(--color-text-primary)]">{step.doseMg.toFixed(4)}</span>
                    <span class="text-sm text-[var(--color-text-tertiary)]">mg</span>
                  </div>
                  <div class="text-xs text-[var(--color-text-secondary)] num">
                    {step.doseMgKgDose.toFixed(4)} mg/kg/dose
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {:else}
          <div class="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center" aria-hidden="true">
            <p class="text-sm font-medium text-[var(--color-text-tertiary)]">
              Enter values above to generate weaning schedule.
            </p>
          </div>
        {/if}
      {/if}
    </div>
  {/each}

  <!-- Clear Button -->
  {#if hasValues}
    <div class="flex justify-center">
      <button
        type="button"
        onclick={clearInputs}
        class="text-2xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-3 py-1.5 rounded-lg min-h-[36px]"
      >
        Clear inputs
      </button>
    </div>
  {/if}
</div>
