<script lang="ts">
  import { fade } from 'svelte/transition';
  import { untrack } from 'svelte';
  import { getCalculatorContext } from '../context.js';

  let {
    primaryValue,
    primaryUnit,
    primaryLabel,
    secondaryValue,
    secondaryUnit,
    secondaryLabel,
    isVisible = true,
    accentVariant,
  }: {
    primaryValue: string;
    primaryUnit: string;
    primaryLabel: string;
    secondaryValue?: string;
    secondaryUnit?: string;
    secondaryLabel?: string;
    isVisible?: boolean;
    accentVariant?: 'clinical' | 'bmf';
  } = $props();

  const ctx = getCalculatorContext();

  // Determine the accent variant from prop or context
  const resolvedVariant = $derived(
    accentVariant ?? (ctx.id === 'formula' ? 'clinical' : 'clinical')
  );

  // Card background class based on variant
  const cardBgClass = $derived(
    resolvedVariant === 'bmf'
      ? 'bg-[var(--color-bmf-600)] border border-[var(--color-bmf-700)]'
      : 'bg-[var(--color-accent)] border border-[var(--color-accent)]'
  );

  // Effect to trigger pulse animation on value change
  let pulseTrigger = $state(0);
  $effect(() => {
    primaryValue;
    untrack(() => {
      pulseTrigger += 1;
    });
  });
</script>

{#if isVisible}
  <!-- aria-live announces updated values to screen readers -->
  <div
    class="w-full space-y-3"
    aria-live="polite"
    aria-atomic="true"
    aria-label="Result: {primaryValue} {primaryUnit}"
    transition:fade={{ duration: 300 }}
  >
    <!-- Primary Result Card -->
    <div class="px-6 py-5 rounded-3xl shadow-lg text-white flex flex-col justify-between min-h-[148px] {cardBgClass}">
      <div class="flex items-center justify-between mb-auto">
        <span class="font-bold uppercase tracking-[0.2em] text-xs text-white opacity-90">{primaryLabel}</span>
      </div>
      {#key pulseTrigger}
        <div class="pulse-container mt-4">
          <div class="flex items-baseline gap-2">
            <span class="text-display font-black leading-none num">{primaryValue}</span>
            <span class="font-bold text-xl text-white opacity-90">{primaryUnit}</span>
          </div>
        </div>
      {/key}
    </div>

    <!-- Optional Secondary Result Card -->
    {#if secondaryValue !== undefined}
      <div class="px-6 py-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[120px] bg-[var(--color-surface-card)] border border-[var(--color-border)]">
        <div class="flex items-center justify-between mb-auto">
          <span class="font-bold uppercase tracking-[0.2em] text-xs text-[var(--color-text-secondary)] opacity-90">{secondaryLabel ?? ''}</span>
        </div>
        {#key pulseTrigger}
          <div class="pulse-container mt-3">
            <div class="flex items-baseline gap-2">
              <span class="text-title font-black leading-none num text-[var(--color-text-primary)]">{secondaryValue}</span>
              <span class="font-bold text-lg text-[var(--color-text-secondary)]">{secondaryUnit ?? ''}</span>
            </div>
          </div>
        {/key}
      </div>
    {/if}
  </div>
{/if}

<style>
  @keyframes pulse-once {
    0% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  .pulse-container {
    animation: pulse-once 200ms ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse-container {
      animation: none;
    }
  }
</style>
