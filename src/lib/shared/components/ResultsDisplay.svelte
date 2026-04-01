<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { untrack } from 'svelte';
  import { getCalculatorContext } from '../context.js';

  /** A single dispensing measure (e.g. Scoops: 0.5) */
  export type DispensingMeasure = {
    label: string;
    value: string | number;
  };

  let {
    primaryValue,
    primaryUnit,
    primaryLabel,
    secondaryValue,
    secondaryUnit,
    secondaryLabel,
    dispensingMeasures,
    isVisible = true,
    accentVariant,
  }: {
    primaryValue: string;
    primaryUnit: string;
    primaryLabel: string;
    secondaryValue?: string;
    secondaryUnit?: string;
    secondaryLabel?: string;
    dispensingMeasures?: DispensingMeasure[];
    isVisible?: boolean;
    accentVariant?: 'clinical' | 'bmf';
  } = $props();

  const ctx = getCalculatorContext();

  // Determine the accent variant from prop or context
  const resolvedVariant = $derived(
    accentVariant ?? (ctx.id === 'formula' ? 'clinical' : 'clinical')
  );

  // Card background class based on variant — uses dedicated result tokens
  // that are dark enough for 4.5:1 contrast with white text (WCAG 1.4.3)
  const cardBgClass = $derived(
    resolvedVariant === 'bmf'
      ? 'bg-[var(--color-bmf-result)] border border-[var(--color-bmf-result)]'
      : 'bg-[var(--color-accent-result)] border border-[var(--color-accent-result)]'
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
    class="w-full"
    aria-live="polite"
    aria-atomic="true"
    aria-label="Result: {primaryValue} {primaryUnit}"
    transition:fly={{ y: 12, duration: 300, easing: cubicOut }}
  >
    <!-- Unified Result Card -->
    <div class="px-6 py-5 rounded-3xl shadow-lg text-white flex flex-col gap-1 min-h-[148px] {cardBgClass}">
      <!-- Label — xs, recedes -->
      <span class="font-bold uppercase tracking-[0.2em] text-xs text-white/90">{primaryLabel}</span>

      <!-- Primary value — hero display size -->
      {#key pulseTrigger}
        <div class="pulse-container mt-3">
          <div class="flex items-baseline gap-2">
            <span class="text-display font-black leading-none num">{primaryValue}</span>
            <span class="font-bold text-xl text-white/90">{primaryUnit}</span>
          </div>
        </div>
      {/key}

      <!-- Secondary value — title size, slightly receded -->
      {#if secondaryValue !== undefined}
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="text-title font-bold leading-tight num text-white">{secondaryValue}</span>
          <span class="font-semibold text-base text-white/85">{secondaryUnit ?? ''}</span>
          {#if secondaryLabel}
            <span class="font-medium text-sm text-white/80">{secondaryLabel}</span>
          {/if}
        </div>
      {/if}

      <!-- Tertiary — dispensing measures, small inline text -->
      {#if dispensingMeasures && dispensingMeasures.length > 0}
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-3 pt-3 border-t border-white/25">
          {#each dispensingMeasures as measure, i}
            <span class="text-ui text-white/80">
              <span class="font-medium">{measure.label}</span>
              <span class="font-semibold num text-white/90">{measure.value}</span>
            </span>
          {/each}
        </div>
      {/if}
    </div>
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
