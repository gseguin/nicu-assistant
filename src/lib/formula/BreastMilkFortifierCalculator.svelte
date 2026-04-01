<script lang="ts">
  import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import ResultsDisplay from '$lib/shared/components/ResultsDisplay.svelte';
  import { BRANDS, type BrandConfig, getBrandById } from '$lib/formula/formula-config.js';
  import { calculateBMF, validateBMFInputs } from '$lib/formula/formula.js';
  import { formulaState } from '$lib/formula/state.svelte.js';
  import type { SelectOption } from '$lib/shared/types.js';
  import { Info, AlertCircle } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  // Brand options mapped for SelectPicker (CRITICAL: use `value`, not `id`)
  const brandOptions: SelectOption[] = BRANDS.map(b => ({
    value: b.id,
    label: b.brand,
    group: b.manufacturer
  }));

  // Local numeric state synced with string-based formulaState
  let targetKcalOz = $state<number | null>(
    formulaState.current.bmf.targetKcalOzRaw
      ? parseFloat(formulaState.current.bmf.targetKcalOzRaw)
      : null
  );
  let volumeMl = $state<number | null>(
    formulaState.current.bmf.volumeMlRaw
      ? parseFloat(formulaState.current.bmf.volumeMlRaw)
      : null
  );
  let baselineKcalOz = $state<number | null>(
    formulaState.current.bmf.baselineKcalOzRaw
      ? parseFloat(formulaState.current.bmf.baselineKcalOzRaw)
      : null
  );

  // Sync local numeric values back to string state
  $effect(() => {
    formulaState.current.bmf.targetKcalOzRaw = targetKcalOz === null ? '' : String(targetKcalOz);
  });
  $effect(() => {
    formulaState.current.bmf.volumeMlRaw = volumeMl === null ? '' : String(volumeMl);
  });
  $effect(() => {
    formulaState.current.bmf.baselineKcalOzRaw = baselineKcalOz === null ? '' : String(baselineKcalOz);
  });

  // Resolve selected brand from state
  const selectedBrand = $derived<BrandConfig | undefined>(
    formulaState.current.bmf.selectedBrandId
      ? getBrandById(formulaState.current.bmf.selectedBrandId)
      : undefined
  );

  // BMF guard: target must exceed baseline
  const guardViolation = $derived(
    targetKcalOz !== null && baselineKcalOz !== null && targetKcalOz <= baselineKcalOz
  );

  // Derived recipe calculation (preserving $derived.by pattern)
  const { recipe, calcError } = $derived.by(() => {
    if (!selectedBrand || targetKcalOz === null || volumeMl === null || baselineKcalOz === null) {
      return { recipe: null, calcError: null };
    }
    // Guard surfaced separately via UI (not an error)
    if (targetKcalOz <= baselineKcalOz) return { recipe: null, calcError: null };
    const validation = validateBMFInputs(targetKcalOz, volumeMl, baselineKcalOz);
    if (!validation.valid) {
      return { recipe: null, calcError: validation.errors[0] };
    }
    try {
      return { recipe: calculateBMF(selectedBrand, targetKcalOz, volumeMl, baselineKcalOz), calcError: null };
    } catch (e) {
      return { recipe: null, calcError: e instanceof Error ? e.message : 'Calculation failed' };
    }
  });
</script>

<div class="space-y-6">
  <!-- Inputs Section -->
  <div class="card space-y-4">
    <SelectPicker
      label="Formula Brand"
      bind:value={formulaState.current.bmf.selectedBrandId}
      options={brandOptions}
      placeholder="Select Brand..."
    />

    <div class="grid grid-cols-2 gap-4">
      <NumericInput
        bind:value={targetKcalOz}
        label="Target kcal/oz"
        suffix="kcal/oz"
        min={20}
        max={30}
        step={0.5}
      />
      <NumericInput
        bind:value={volumeMl}
        label="Volume"
        suffix="mL"
        min={1}
        max={500}
        step={1}
      />
    </div>

    <div class="pt-2 border-t border-[var(--color-border)]">
      <NumericInput
        bind:value={baselineKcalOz}
        label="Baseline EBM"
        suffix="kcal/oz"
        min={18}
        max={24}
        step={0.5}
      />
      <div class="mt-2 flex gap-2 p-2 bg-[var(--color-surface-alt)] rounded-lg text-2xs text-[var(--color-text-secondary)] italic">
        <Info class="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
        <p>{baselineKcalOz !== null ? `Using ${baselineKcalOz} kcal/oz as the breast milk baseline.` : 'Enter a baseline calorie value.'} Change this if you have a measured value.</p>
      </div>
    </div>
  </div>

  <!-- Results Section -->
  {#if calcError}
    <div class="p-4 bg-[var(--color-error-light)] rounded-xl border border-[var(--color-error)] flex gap-3 items-start" transition:fade>
      <AlertCircle class="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-sm font-medium text-[var(--color-error)]">{calcError}</p>
    </div>
  {:else if recipe}
    <div transition:slide={{ duration: 300 }}>
      <ResultsDisplay
        primaryValue={String(recipe.g_powder)}
        primaryUnit="g"
        primaryLabel="Required Powder"
        secondaryValue={String(recipe.mL_ebm)}
        secondaryUnit="mL"
        secondaryLabel="Breast Milk"
        accentVariant="bmf"
      />
    </div>

    <!-- Dispensing Measures -->
    {#if recipe.scoops !== null || recipe.packets !== null || recipe.tbsp !== null || recipe.tsp !== null}
      <div class="card" transition:slide={{ duration: 200 }}>
        <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mb-3">Dispensing Measures</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          {#if recipe.scoops !== null}
            <div class="flex justify-between px-2 py-1.5 rounded-lg bg-[var(--color-surface-alt)]">
              <span class="text-[var(--color-text-secondary)]">Scoops</span>
              <span class="font-semibold num text-[var(--color-text-primary)]">{recipe.scoops}</span>
            </div>
          {/if}
          {#if recipe.packets !== null}
            <div class="flex justify-between px-2 py-1.5 rounded-lg bg-[var(--color-surface-alt)]">
              <span class="text-[var(--color-text-secondary)]">Packets</span>
              <span class="font-semibold num text-[var(--color-text-primary)]">{recipe.packets}</span>
            </div>
          {/if}
          {#if recipe.tbsp !== null}
            <div class="flex justify-between px-2 py-1.5 rounded-lg bg-[var(--color-surface-alt)]">
              <span class="text-[var(--color-text-secondary)]">Tablespoons</span>
              <span class="font-semibold num text-[var(--color-text-primary)]">{recipe.tbsp}</span>
            </div>
          {/if}
          {#if recipe.tsp !== null}
            <div class="flex justify-between px-2 py-1.5 rounded-lg bg-[var(--color-surface-alt)]">
              <span class="text-[var(--color-text-secondary)]">Teaspoons</span>
              <span class="font-semibold num text-[var(--color-text-primary)]">{recipe.tsp}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {:else if guardViolation}
    <div class="p-4 bg-[var(--color-bmf-50)] rounded-xl border border-[var(--color-bmf-200)] text-[var(--color-bmf-800)] text-sm font-medium" transition:fade>
      Target must be higher than baseline — increase target kcal/oz or lower the baseline.
    </div>
  {:else}
    <div class="w-full opacity-30 pointer-events-none select-none" aria-hidden="true" transition:fade>
      <div class="bg-[var(--color-bmf-600)] px-6 py-5 rounded-3xl min-h-[148px] flex flex-col justify-between shadow-lg">
        <span class="text-white font-bold uppercase tracking-[0.2em] text-xs opacity-90">Required Powder</span>
        <div class="flex items-baseline gap-2 mt-4">
          <span class="text-display font-black leading-none text-white">--</span>
          <span class="text-white font-bold text-xl opacity-90">grams</span>
        </div>
      </div>
    </div>
  {/if}
</div>
