<script lang="ts">
  import type { GirTitrationRow } from './types.js';

  interface Props {
    rows: GirTitrationRow[];
    selectedBucketId: string | null;
    onselect: (bucketId: string) => void;
  }

  let { rows, selectedBucketId, onselect }: Props = $props();

  // Roving tabindex: selected row if present, else first row
  let focusIndex = $derived.by(() => {
    if (selectedBucketId) {
      const idx = rows.findIndex((r) => r.bucketId === selectedBucketId);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  let rowRefs: (HTMLDivElement | null)[] = $state([]);

  function formatDelta(delta: number): { glyph: string; abs: string; word: string } {
    if (delta > 0) return { glyph: '▲', abs: delta.toFixed(1), word: '(increase)' };
    if (delta < 0) return { glyph: '▼', abs: Math.abs(delta).toFixed(1), word: '(decrease)' };
    return { glyph: '0', abs: '', word: '(no change)' };
  }

  function srLabelFor(bucketId: string, label: string): string {
    // Avoid screen readers reading "<40" as a tag
    switch (bucketId) {
      case 'severe-neuro': return 'severe neurological symptoms';
      case 'lt40': return 'less than 40';
      case 'gt70': return 'greater than 70';
      default: return label;
    }
  }

  function ariaLabelFor(row: GirTitrationRow): string {
    const range = srLabelFor(row.bucketId, row.label);
    if (row.targetGirMgKgMin <= 0) {
      return `Severe neuro signs. Stop dextrose infusion. Current target rate ${row.targetRateMlHr.toFixed(1)} milliliters per hour.`;
    }
    const d = formatDelta(row.deltaRateMlHr);
    if (row.deltaRateMlHr === 0) {
      return `Glucose ${range} mg per deciliter. No change in rate. Target GIR ${row.targetGirMgKgMin.toFixed(1)} milligrams per kilogram per minute, fluids ${row.targetFluidsMlKgDay.toFixed(0)} milliliters per kilogram per day, rate ${row.targetRateMlHr.toFixed(1)} milliliters per hour.`;
    }
    const direction = row.deltaRateMlHr > 0 ? 'increase' : 'decrease';
    return `Glucose ${range} mg per deciliter. ${direction} rate by ${d.abs} milliliters per hour. Target GIR ${row.targetGirMgKgMin.toFixed(1)} milligrams per kilogram per minute, fluids ${row.targetFluidsMlKgDay.toFixed(0)} milliliters per kilogram per day, rate ${row.targetRateMlHr.toFixed(1)} milliliters per hour.`;
  }

  function selectRow(idx: number) {
    if (idx < 0 || idx >= rows.length) return;
    onselect(rows[idx].bucketId);
    // Focus the row after selection
    queueMicrotask(() => rowRefs[idx]?.focus());
  }

  function handleKeydown(e: KeyboardEvent, idx: number) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        selectRow((idx + 1) % rows.length);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        selectRow((idx - 1 + rows.length) % rows.length);
        break;
      case 'Home':
        e.preventDefault();
        selectRow(0);
        break;
      case 'End':
        e.preventDefault();
        selectRow(rows.length - 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onselect(rows[idx].bucketId);
        break;
    }
  }

  function labelWithUnit(row: GirTitrationRow): string {
    if (row.bucketId === 'severe-neuro') return row.label;
    return `${row.label} mg/dL`;
  }
</script>

<!-- Mobile: vertical card stack (<480px) -->
<div
  class="flex flex-col gap-3 sm:hidden"
  role="radiogroup"
  aria-label="Glucose range titration helper"
>
  {#each rows as row, i (row.bucketId)}
    {@const selected = selectedBucketId === row.bucketId}
    {@const stopInfusion = row.bucketId === 'severe-neuro' || row.targetGirMgKgMin <= 0}
    {@const d = formatDelta(row.deltaRateMlHr)}
    <div
      bind:this={rowRefs[i]}
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabelFor(row)}
      tabindex={i === focusIndex ? 0 : -1}
      class="card px-4 py-4 min-h-[88px] cursor-pointer outline-none transition-colors
             focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
             {row.bucketId === 'severe-neuro' && !selected ? 'border-l-2 border-l-[var(--color-text-tertiary)]' : ''}
             {selected ? 'border-l-4 border-l-[var(--color-identity)] bg-[var(--color-identity-hero)]' : ''}"
      onclick={() => selectRow(i)}
      onkeydown={(e) => handleKeydown(e, i)}
    >
      <span class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]">
        IF {row.bucketId === 'severe-neuro' ? 'SEVERE NEURO SIGNS' : `GLUCOSE ${row.label} mg/dL`}
      </span>
      {#if stopInfusion}
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-display font-black uppercase tracking-wider text-[var(--color-text-primary)]">STOP</span>
          <span class="text-ui text-[var(--color-text-tertiary)]">dextrose infusion</span>
        </div>
      {:else if row.deltaRateMlHr === 0}
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-display font-black num text-[var(--color-text-tertiary)]" aria-hidden="true">—</span>
        </div>
      {:else}
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-display font-black num text-[var(--color-text-primary)]" aria-hidden="true">{d.glyph}</span>
          <span class="text-display font-black num text-[var(--color-text-primary)]">{d.abs}</span>
          <span class="text-ui text-[var(--color-text-tertiary)]">ml/hr</span>
          <span class="text-ui text-[var(--color-text-tertiary)]">{d.word}</span>
        </div>
      {/if}
    </div>
  {/each}
</div>

<!-- Desktop: table grid (≥480px) -->
<div
  class="hidden sm:grid grid-cols-[minmax(140px,1.4fr)_1fr] gap-x-3 gap-y-1"
  role="radiogroup"
  aria-label="Glucose range titration helper"
>
  <!-- Header row (non-interactive) -->
  <div class="text-ui font-semibold text-[var(--color-text-secondary)] px-3 py-2">Range</div>
  <div class="text-ui font-semibold text-[var(--color-text-secondary)] px-3 py-2">Δ rate</div>

  {#each rows as row, i (row.bucketId)}
    {@const selected = selectedBucketId === row.bucketId}
    {@const stopInfusion = row.bucketId === 'severe-neuro' || row.targetGirMgKgMin <= 0}
    {@const d = formatDelta(row.deltaRateMlHr)}
    <div
      bind:this={rowRefs[i]}
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabelFor(row)}
      tabindex={i === focusIndex ? 0 : -1}
      class="col-span-full grid grid-cols-subgrid min-h-[48px] items-center px-3 py-2 rounded-lg cursor-pointer outline-none transition-colors
             focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
             {row.bucketId === 'severe-neuro' && !selected ? 'border-l-2 border-l-[var(--color-text-tertiary)]' : ''}
             {selected ? 'border-l-4 border-l-[var(--color-identity)] bg-[var(--color-identity-hero)]' : ''}"
      onclick={() => selectRow(i)}
      onkeydown={(e) => handleKeydown(e, i)}
    >
      <div class="text-base text-[var(--color-text-primary)]">{labelWithUnit(row)}</div>
      {#if stopInfusion}
        <div class="col-span-1 text-base font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">STOP <span class="font-normal normal-case tracking-normal text-[var(--color-text-tertiary)]">dextrose infusion</span></div>
      {:else if row.deltaRateMlHr === 0}
        <div class="text-base font-semibold num text-[var(--color-text-tertiary)]" aria-hidden="true">—</div>
      {:else}
        <div class="text-base font-semibold num text-[var(--color-text-primary)]"><span aria-hidden="true">{d.glyph}</span> {d.abs} ml/hr <span class="text-[var(--color-text-secondary)]">{d.word}</span></div>
      {/if}
    </div>
  {/each}
</div>
