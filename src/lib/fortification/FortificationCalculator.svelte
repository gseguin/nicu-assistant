<script lang="ts">
  import { calculateFortification } from '$lib/fortification/calculations.js';
  import {
    getFormulaById,
    getFortificationFormulas,
  } from '$lib/fortification/fortification-config.js';
  import { untrack } from 'svelte';
  import { fortificationState } from '$lib/fortification/state.svelte.js';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
  import type { SelectOption } from '$lib/shared/types.js';
  import type { BaseType, UnitType, TargetKcalOz } from './types.js';

  // --- String-bridge mirrors for SelectPicker (locked approach) -----------
  let kcalStr = $state(String(fortificationState.current.targetKcalOz));
  let baseStr = $state<string>(fortificationState.current.base);
  let formulaStr = $state<string>(fortificationState.current.formulaId);

  // Mirror → state (user input flows down to state).
  $effect(() => {
    const k = kcalStr;
    untrack(() => {
      const nextKcal = parseInt(k, 10) as TargetKcalOz;
      if (fortificationState.current.targetKcalOz !== nextKcal) {
        fortificationState.current.targetKcalOz = nextKcal;
      }
    });
  });
  $effect(() => {
    const b = baseStr;
    untrack(() => {
      if (fortificationState.current.base !== b) {
        fortificationState.current.base = b as BaseType;
      }
    });
  });
  $effect(() => {
    const f = formulaStr;
    untrack(() => {
      if (fortificationState.current.formulaId !== f) {
        fortificationState.current.formulaId = f;
      }
    });
  });

  // State → mirrors (external changes flow up to mirrors). Equality guards prevent ping-pong.
  $effect(() => {
    const s = fortificationState.current;
    if (kcalStr !== String(s.targetKcalOz)) kcalStr = String(s.targetKcalOz);
    if (baseStr !== s.base) baseStr = s.base;
    if (formulaStr !== s.formulaId) formulaStr = s.formulaId;
  });

  // --- Option lists --------------------------------------------------------
  const baseOptions: SelectOption[] = [
    { value: 'breast-milk', label: 'Breast milk' },
    { value: 'water', label: 'Water' },
  ];

  const formulaOptions: SelectOption[] = getFortificationFormulas()
    .slice()
    .sort(
      (a, b) =>
        a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name)
    )
    .map((f) => ({ value: f.id, label: f.name, group: f.manufacturer }));

  const kcalOptions: SelectOption[] = [
    { value: '22', label: '22 kcal/oz' },
    { value: '24', label: '24 kcal/oz' },
    { value: '26', label: '26 kcal/oz' },
    { value: '28', label: '28 kcal/oz' },
    { value: '30', label: '30 kcal/oz' },
  ];

  // --- All-units display ---------------------------------------------------
  const ALL_UNITS = ['grams', 'teaspoons', 'tablespoons', 'scoops', 'packets'] as const satisfies readonly UnitType[];

  const UNIT_LABELS: Record<UnitType, string> = {
    grams: 'Grams',
    teaspoons: 'Teaspoons',
    tablespoons: 'Tablespoons',
    scoops: 'Scoops',
    packets: 'Packets',
  };

  function shouldShowRow(unit: UnitType, formulaId: string): boolean {
    if (unit === 'packets') return formulaId === 'similac-hmf';
    return true;
  }

  let unitResults = $derived.by(() => {
    const { base, volumeMl, formulaId, targetKcalOz } = fortificationState.current;
    if (volumeMl === null || volumeMl <= 0) return null;
    const formula = getFormulaById(formulaId);
    if (!formula) return null;
    return ALL_UNITS.map((unit) => ({
      unit,
      result: calculateFortification({ formula, base, volumeMl, targetKcalOz, unit }),
    }));
  });

  let gramsResult = $derived.by(() => {
    const { base, volumeMl, formulaId, targetKcalOz } = fortificationState.current;
    if (volumeMl === null || volumeMl <= 0) return null;
    const formula = getFormulaById(formulaId);
    if (!formula) return null;
    return calculateFortification({ formula, base, volumeMl, targetKcalOz, unit: 'grams' });
  });

  function formatAmount(n: number): string {
    return n.toFixed(2).replace(/\.?0+$/, '');
  }

  // Persist on any state change (mirror morphine)
  $effect(() => {
    JSON.stringify(fortificationState.current);
    fortificationState.persist();
  });
</script>

<div class="space-y-6">
  <!-- Inputs Card -->
  <section class="card flex flex-col gap-4">
    <SelectPicker label="Base" bind:value={baseStr} options={baseOptions} />

    <NumericInput
      bind:value={fortificationState.current.volumeMl}
      label="Starting Volume (mL)"
      suffix="mL"
      min={1}
      max={1000}
      step={1}
      placeholder="180"
      id="fortification-volume"
    />

    <SelectPicker label="Formula" bind:value={formulaStr} options={formulaOptions} />

    <SelectPicker
      label="Target Calorie (kcal/oz)"
      bind:value={kcalStr}
      options={kcalOptions}
    />
  </section>

  <!-- Hero: Amount to Add -->
  <section class="card" aria-live="polite" aria-atomic="true">
    <span
      class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide"
    >
      Amount to Add
    </span>
    {#if unitResults}
      <dl class="mt-3 flex flex-col gap-2">
        {#each unitResults as { unit, result } (unit)}
          {#if shouldShowRow(unit, fortificationState.current.formulaId)}
            <div
              class="flex items-baseline justify-between"
              data-unit-row={unit}
            >
              <dt class="text-sm text-[var(--color-text-secondary)]">
                {UNIT_LABELS[unit]}
              </dt>
              <dd
                class="text-base font-semibold num text-[var(--color-text-primary)]"
              >
                {formatAmount(result.amountToAdd)}
              </dd>
            </div>
          {/if}
        {/each}
      </dl>
    {:else}
      <div class="mt-2 text-sm text-[var(--color-text-tertiary)]">
        Enter a starting volume to see the recipe.
      </div>
    {/if}
  </section>

  <!-- Verification Card -->
  {#if gramsResult}
    <section class="card" aria-label="Verification">
      <span
        class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide"
      >
        Verification
      </span>
      <dl class="mt-2 flex flex-col gap-2">
        <div class="flex items-baseline justify-between">
          <dt class="text-sm text-[var(--color-text-secondary)]">Yield</dt>
          <dd class="text-base font-semibold num text-[var(--color-text-primary)]">
            {gramsResult.yieldMl.toFixed(1)} mL
          </dd>
        </div>
        <div class="flex items-baseline justify-between">
          <dt class="text-sm text-[var(--color-text-secondary)]">Exact</dt>
          <dd class="text-base font-semibold num text-[var(--color-text-primary)]">
            {gramsResult.exactKcalPerOz.toFixed(1)} kcal/oz
          </dd>
        </div>
      </dl>
    </section>
  {/if}
</div>
