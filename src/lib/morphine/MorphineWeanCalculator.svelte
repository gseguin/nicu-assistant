<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateLinearSchedule, calculateCompoundingSchedule } from '$lib/morphine/calculations.js';
  import { morphineState } from '$lib/morphine/state.svelte.js';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
  import type { WeanMode, WeanStep, MorphineInputRanges } from '$lib/morphine/types.js';
  import config from '$lib/morphine/morphine-config.json';

  const inputs = config.inputs as MorphineInputRanges;

  const MODE_OPTIONS: { value: WeanMode; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'compounding', label: 'Compounding' },
  ];

  // Dock-style magnification: scale cards based on distance from viewport center
  let activeStepIndex = $state(-1);
  let scheduleContainer: HTMLElement | undefined = $state();

  onMount(() => {
    if (!scheduleContainer) return;

    const prefersReducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

    // Expose magnification trigger for mode-switch re-initialization
  let triggerMagnification: (() => void) | null = null;

  // Dock-style magnification: continuous floating index driven by scroll progress.
    // Maps total scroll position to a floating index (0.0 → 9.0) so the magnification
    // slides smoothly through cards in the scroll direction, like the macOS Dock.
    const MAX_SCALE = 1.06;
    const MAX_SHADOW_BOOST = 4;

    let rafId: number | null = null;

    function updateMagnification() {
      const cards = scheduleContainer?.querySelectorAll<HTMLElement>('[data-step-index]');
      if (!cards?.length) return;

      if (prefersReducedMotion || !isMobile()) {
        cards.forEach((card) => {
          card.style.transform = '';
          card.style.boxShadow = '';
          card.style.zIndex = '';
        });
        return;
      }

      const n = cards.length;
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      // Map scroll position to a continuous floating index across all cards
      // scrollY=0 → index 0, scrollY=max → index n-1
      const scrollProgress = scrollMax > 0 ? window.scrollY / scrollMax : 0;
      const floatingIdx = scrollProgress * (n - 1);

      cards.forEach((card, i) => {
        // Continuous distance from the floating index
        const dist = Math.abs(i - floatingIdx);
        // 0 → full (1.06), 1 → medium (1.03), 2 → slight, 3+ → none
        // Use radius of 2.5 so 3 cards are always visibly magnified
        const t = Math.max(0, 1 - dist / 2.5);
        const scale = 1 + (MAX_SCALE - 1) * t;
        const shadowBoost = MAX_SHADOW_BOOST * t;

        card.style.transform = `scale(${scale})`;
        card.style.boxShadow = shadowBoost > 0.5
          ? `0 ${1 + shadowBoost}px ${4 + shadowBoost * 2}px rgba(0,0,0,${0.04 + 0.06 * t})`
          : '';
        card.style.zIndex = t > 0.3 ? '1' : '';
      });

      const bestIdx = Math.round(floatingIdx);
      if (bestIdx !== activeStepIndex) {
        activeStepIndex = bestIdx;
      }
    }

    function onScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateMagnification();
        rafId = null;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial pass
    updateMagnification();
    // Expose for mode-switch re-trigger
    triggerMagnification = updateMagnification;

    // Re-run when cards change (mode switch)
    const mutObserver = new MutationObserver(() => updateMagnification());
    mutObserver.observe(scheduleContainer, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      mutObserver.disconnect();
      triggerMagnification = null;
    };
  });

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

  // Recalculation feedback: derive a key from schedule identity to trigger CSS animation via {#key}
  let calcKey = $derived(
    schedule.length > 0
      ? `${schedule[0].doseMg}-${schedule[schedule.length - 1].doseMg}-${morphineState.current.activeMode}`
      : ''
  );

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
  <SegmentedToggle
    label="Weaning mode"
    ariaLabel="Weaning mode"
    bind:value={morphineState.current.activeMode}
    options={MODE_OPTIONS}
  />

  <!-- Inputs Card -->
  <section class="card flex flex-col gap-4">
    <NumericInput
      bind:value={morphineState.current.weightKg}
      label="Dosing weight"
      suffix="kg"
      min={inputs.weightKg.min}
      max={inputs.weightKg.max}
      step={inputs.weightKg.step}
      placeholder="3.1"
      id="morphine-weight"
    />
    <NumericInput
      bind:value={morphineState.current.maxDoseMgKgDose}
      label="Max morphine dose"
      suffix="mg/kg/dose"
      min={inputs.maxDoseMgKgDose.min}
      max={inputs.maxDoseMgKgDose.max}
      step={inputs.maxDoseMgKgDose.step}
      placeholder="0.04"
      id="morphine-max-dose"
    />
    <NumericInput
      bind:value={morphineState.current.decreasePct}
      label="Decrease per step"
      suffix="%"
      min={inputs.decreasePct.min}
      max={inputs.decreasePct.max}
      step={inputs.decreasePct.step}
      placeholder="10"
      id="morphine-decrease"
    />
  </section>

  <!-- Schedule content (single instance — reacts to activeMode via derived schedule) -->
  {#if schedule.length > 0}
    <!-- Summary: start → end dose (pulses on recalculation) -->
    {@const first = schedule[0]}
    {@const last = schedule[schedule.length - 1]}
    {@const totalReduction = first.doseMg - last.doseMg}
    {#key calcKey}
    <div class="card px-4 py-3 flex items-center justify-between bg-[var(--color-identity-hero)] animate-result-pulse" aria-live="polite" aria-atomic="true">
      <div class="flex flex-col">
        <span class="text-2xs font-semibold text-[var(--color-identity)]">Start</span>
        <span class="text-base font-bold num text-[var(--color-text-primary)]">{first.doseMg.toFixed(4)} mg</span>
      </div>
      <div class="text-[var(--color-text-tertiary)] text-lg">→</div>
      <div class="flex flex-col items-end">
        <span class="text-2xs font-semibold text-[var(--color-identity)]">Step {last.step}</span>
        <span class="text-base font-bold num text-[var(--color-text-primary)]">{last.doseMg.toFixed(4)} mg</span>
      </div>
      <div class="flex flex-col items-end pl-3 border-l border-[var(--color-border)]">
        <span class="text-2xs font-semibold text-[var(--color-identity)]">Total reduction</span>
        <span class="text-sm font-semibold num text-[var(--color-text-primary)]">{(totalReduction / first.doseMg * 100).toFixed(1)}%</span>
      </div>
    </div>
    {/key}

    <section aria-label="Weaning schedule" aria-live="polite" aria-atomic="true" class="mt-4">
      <div class="space-y-2" bind:this={scheduleContainer}>
        {#each schedule as step, i}
          {@const isFirst = step.step === 1}
          {@const reductionPct = i > 0 && schedule[i - 1].doseMg > 0 ? (step.reductionMg / schedule[i - 1].doseMg * 100) : 0}
          <div
            data-step-index={i}
            class="card px-4 py-3 flex flex-col gap-1 will-change-transform origin-center"
          >
            <div class="flex items-center justify-between">
              <span class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]">
                {isFirst ? 'Step 1 — Starting dose' : `Step ${step.step}`}
              </span>
              {#if step.reductionMg > 0}
                <span class="text-2xs font-medium text-[var(--color-text-tertiary)] pr-1">-{step.reductionMg.toFixed(4)} mg ({reductionPct.toFixed(1)}%)</span>
              {/if}
            </div>
            <div class="flex items-baseline gap-2">
              <span class="{isFirst ? 'text-xl' : 'text-lg'} font-bold num text-[var(--color-text-primary)]">{step.doseMg.toFixed(4)}</span>
              <span class="text-sm text-[var(--color-text-tertiary)]">mg</span>
            </div>
            <div class="text-2xs font-medium text-[var(--color-text-secondary)] num">
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

  <!-- Clear Button -->
  {#if hasValues}
    <div class="flex justify-center">
      <button
        type="button"
        onclick={clearInputs}
        class="text-2xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-3 py-1.5 rounded-lg min-h-[36px]"
      >
        Clear inputs
      </button>
    </div>
  {/if}
</div>

