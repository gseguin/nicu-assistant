<script lang="ts">
  import { calculateGir } from './calculations.js';
  import { girState } from './state.svelte.js';
  import GlucoseTitrationGrid from './GlucoseTitrationGrid.svelte';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import config from './gir-config.json';
  import type { GirInputRanges, GlucoseBucket } from './types.js';
  import { AlertTriangle, Info } from '@lucide/svelte';

  const inputs = config.inputs as GirInputRanges;
  // JSON import is inferred as `string` for `id`; re-narrow to the discriminated
  // union on the type side. Runtime shape is identical — this is type-only.
  const buckets = config.glucoseBuckets as unknown as GlucoseBucket[];

  let result = $derived(calculateGir(girState.current, buckets));

  let currentGir = $derived(result?.currentGirMgKgMin ?? null);
  let initialRate = $derived(result?.initialRateMlHr ?? null);

  let pulseKey = $derived(
    result ? `${currentGir!.toFixed(1)}-${initialRate!.toFixed(1)}` : ''
  );

  let selectedRow = $derived(
    result && girState.current.selectedBucketId
      ? result.titration.find((r) => r.bucketId === girState.current.selectedBucketId) ?? null
      : null
  );

  let targetPulseKey = $derived(selectedRow ? selectedRow.bucketId : '');

  // Advisory flags
  let showDexAdvisory = $derived(
    girState.current.dextrosePct != null && girState.current.dextrosePct > 12.5
  );
  let showGirHighAdvisory = $derived(currentGir != null && currentGir > 12);
  let showGirLowAdvisory = $derived(currentGir != null && currentGir > 0 && currentGir < 4);

  function handleSelectBucket(bucketId: string) {
    girState.current.selectedBucketId = bucketId;
  }

  type DeltaHero =
    | { kind: 'stop' }
    | { kind: 'no-change' }
    | { kind: 'delta'; glyph: '▲' | '▼'; abs: string; word: '(increase)' | '(decrease)' };

  function deltaHero(row: { bucketId: string; deltaRateMlHr: number; targetGirMgKgMin: number }): DeltaHero {
    if (row.targetGirMgKgMin <= 0) return { kind: 'stop' };
    if (row.deltaRateMlHr === 0) return { kind: 'no-change' };
    if (row.deltaRateMlHr > 0)
      return { kind: 'delta', glyph: '▲', abs: row.deltaRateMlHr.toFixed(1), word: '(increase)' };
    return { kind: 'delta', glyph: '▼', abs: Math.abs(row.deltaRateMlHr).toFixed(1), word: '(decrease)' };
  }

  // Persist on change
  $effect(() => {
    JSON.stringify(girState.current);
    girState.persist();
  });
</script>

<div class="space-y-6">
  <!-- INPUTS CARD -->
  <section class="card flex flex-col gap-4">
    <NumericInput
      bind:value={girState.current.weightKg}
      label="Weight"
      suffix="kg"
      min={inputs.weightKg.min}
      max={inputs.weightKg.max}
      step={inputs.weightKg.step}
      placeholder="3.1"
      id="gir-weight"
      showRangeHint={true}
      showRangeError={true}
    />
    <NumericInput
      bind:value={girState.current.dextrosePct}
      label="Dextrose"
      suffix="%"
      min={inputs.dextrosePct.min}
      max={inputs.dextrosePct.max}
      step={inputs.dextrosePct.step}
      placeholder="12.5"
      id="gir-dextrose"
      showRangeHint={true}
      showRangeError={true}
    />

    {#if showDexAdvisory}
      <div
        class="rounded-xl px-4 py-3 flex items-start gap-3 border-l-4"
        style="background: var(--color-bmf-50); border-left-color: var(--color-bmf-600);"
        role="note"
      >
        <AlertTriangle size={20} class="text-[var(--color-bmf-600)] shrink-0 mt-0.5" aria-hidden="true" />
        <p class="text-base font-semibold text-[var(--color-text-primary)]">
          Dextrose &gt;12.5% requires central venous access
        </p>
      </div>
    {/if}

    <NumericInput
      bind:value={girState.current.mlPerKgPerDay}
      label="Fluid order"
      suffix="ml/kg/day"
      min={inputs.mlPerKgPerDay.min}
      max={inputs.mlPerKgPerDay.max}
      step={inputs.mlPerKgPerDay.step}
      placeholder="80"
      id="gir-fluid"
      showRangeHint={true}
      showRangeError={true}
    />
  </section>

  <!-- CURRENT GIR HERO -->
  {#key pulseKey}
    <section
      class="card px-5 py-5 animate-result-pulse"
      style="background: var(--color-identity-hero);"
      aria-live="polite"
      aria-atomic="true"
    >
      {#if result}
        <div class="flex flex-col gap-3">
          <div>
            <div class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]">
              CURRENT GIR
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-display font-black num text-[var(--color-text-primary)]">{currentGir!.toFixed(1)}</span>
              <span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min</span>
            </div>
          </div>
          <div>
            <div class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]">
              INITIAL RATE
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-title font-bold num text-[var(--color-text-primary)]">{initialRate!.toFixed(1)}</span>
              <span class="text-ui text-[var(--color-text-secondary)]">ml/hr</span>
            </div>
          </div>
        </div>
      {:else}
        <p class="text-ui text-[var(--color-text-secondary)]">
          Enter weight, dextrose %, and fluid rate to compute GIR
        </p>
      {/if}
    </section>
  {/key}

  <!-- Tier 2 advisories -->
  {#if showGirHighAdvisory}
    <div class="card px-4 py-3 flex items-start gap-2">
      <Info size={16} class="text-[var(--color-text-secondary)] shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-ui text-[var(--color-text-secondary)]">
        GIR &gt;12 mg/kg/min — consider hyperinsulinism workup / central access
      </p>
    </div>
  {/if}
  {#if showGirLowAdvisory}
    <div class="card px-4 py-3 flex items-start gap-2">
      <Info size={16} class="text-[var(--color-text-secondary)] shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-ui text-[var(--color-text-secondary)]">
        Below basal glucose utilization (≈4–6 mg/kg/min)
      </p>
    </div>
  {/if}

  <!-- TITRATION GRID HEADER + GRID -->
  {#if result}
    <section class="space-y-2">
      <h2 class="text-ui font-semibold text-[var(--color-text-primary)]">If current glucose is…</h2>
      <p class="text-2xs text-[var(--color-text-tertiary)]">
        Institutional titration helper — verify against your protocol before acting.
      </p>
      <GlucoseTitrationGrid
        rows={result.titration}
        selectedBucketId={girState.current.selectedBucketId}
        onselect={handleSelectBucket}
      />
    </section>

    <!-- TARGET-GUIDANCE HERO -->
    {#key targetPulseKey}
      <section
        class="card px-5 py-5 animate-result-pulse"
        style="background: var(--color-identity-hero);"
        aria-live="polite"
        aria-atomic="true"
      >
        {#if selectedRow}
          {@const hero = deltaHero(selectedRow)}
          <div class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]">
            {#if hero.kind === 'stop'}HYPERGLYCEMIA{:else if hero.kind === 'no-change'}TARGET REACHED{:else}ADJUST RATE{/if}
          </div>
          {#if hero.kind === 'stop'}
            <div class="flex items-baseline gap-2">
              <span class="text-display font-black uppercase tracking-wider text-[var(--color-text-primary)]">STOP</span>
              <span class="text-ui text-[var(--color-text-secondary)]">dextrose infusion</span>
            </div>
          {:else if hero.kind === 'no-change'}
            <div class="flex items-baseline gap-2">
              <span class="text-display font-black num text-[var(--color-text-tertiary)]" aria-hidden="true">—</span>
              <span class="text-ui text-[var(--color-text-secondary)]">no change</span>
            </div>
            <div class="text-ui text-[var(--color-text-secondary)] num mt-2">
              {selectedRow.targetFluidsMlKgDay.toFixed(0)} ml/kg/day · {selectedRow.targetRateMlHr.toFixed(1)} ml/hr · {selectedRow.targetGirMgKgMin.toFixed(1)} mg/kg/min
            </div>
          {:else}
            <div class="flex items-baseline gap-2">
              <span class="text-display font-black num text-[var(--color-text-primary)]">{hero.glyph} {hero.abs}</span>
              <span class="text-ui text-[var(--color-text-tertiary)]">ml/hr</span>
              <span class="text-ui text-[var(--color-text-secondary)]">{hero.word}</span>
            </div>
            <div class="text-ui text-[var(--color-text-secondary)] num mt-2">
              {selectedRow.targetFluidsMlKgDay.toFixed(0)} ml/kg/day · {selectedRow.targetRateMlHr.toFixed(1)} ml/hr · {selectedRow.targetGirMgKgMin.toFixed(1)} mg/kg/min
            </div>
          {/if}
        {:else}
          <p class="text-ui text-[var(--color-text-secondary)]">
            Select a glucose range to see target rate
          </p>
        {/if}
      </section>
    {/key}
  {/if}

  <!-- POPULATION REFERENCE CARD -->
  <section class="card px-5 py-4">
    <div class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)] mb-3">
      Starting GIR by population
    </div>
    <div class="grid grid-cols-[1fr_auto] gap-y-2 gap-x-4">
      <div class="text-ui text-[var(--color-text-secondary)]">IDM / LGA</div>
      <div class="text-base font-semibold num text-[var(--color-text-primary)]">3–5 <span class="text-ui text-[var(--color-text-tertiary)]">mg/kg/min</span></div>
      <div class="text-ui text-[var(--color-text-secondary)]">IUGR</div>
      <div class="text-base font-semibold num text-[var(--color-text-primary)]">5–7 <span class="text-ui text-[var(--color-text-tertiary)]">mg/kg/min</span></div>
      <div class="text-ui text-[var(--color-text-secondary)]">Preterm or NPO</div>
      <div class="text-base font-semibold num text-[var(--color-text-primary)]">4–6 <span class="text-ui text-[var(--color-text-tertiary)]">mg/kg/min</span></div>
    </div>
    <p class="text-2xs text-[var(--color-text-tertiary)] mt-3">
      Reference ranges only — not a prescription.
    </p>
  </section>
</div>
