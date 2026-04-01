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
      : 120
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

  // Inline guidance when values are entered but no brand is selected
  const noBrandHint = $derived(
    !formulaState.current.bmf.selectedBrandId && (targetKcalOz !== null || volumeMl !== null || baselineKcalOz !== null)
      ? 'Select a formula brand to calculate.'
      : ''
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

  const hasValues = $derived(
    formulaState.current.bmf.selectedBrandId !== '' ||
    targetKcalOz !== null ||
    (volumeMl !== null && volumeMl !== 120) ||
    (baselineKcalOz !== null && baselineKcalOz !== 20)
  );

  function clearForm() {
    formulaState.current.bmf.selectedBrandId = '';
    formulaState.current.bmf.targetKcalOzRaw = '';
    formulaState.current.bmf.volumeMlRaw = '';
    formulaState.current.bmf.baselineKcalOzRaw = '20';
    targetKcalOz = null;
    volumeMl = 120;
    baselineKcalOz = 20;
  }
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
    {#if noBrandHint}
      <p class="text-xs text-[var(--color-text-secondary)] ml-1 -mt-2" transition:slide={{ duration: 150 }}>{noBrandHint}</p>
    {/if}

    <div class="grid grid-cols-2 gap-4">
      <NumericInput
        bind:value={targetKcalOz}
        label="Target kcal/oz"
        suffix="kcal/oz"
        min={20}
        max={30}
        step={0.5}
        placeholder="24"
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
        secondaryLabel="breast milk"
        accentVariant="bmf"
        dispensingMeasures={[
          ...(recipe.scoops !== null ? [{ label: 'Scoops', value: recipe.scoops }] : []),
          ...(recipe.packets !== null ? [{ label: 'Packets', value: recipe.packets }] : []),
          ...(recipe.tbsp !== null ? [{ label: 'Tbsp', value: recipe.tbsp }] : []),
          ...(recipe.tsp !== null ? [{ label: 'Tsp', value: recipe.tsp }] : []),
        ]}
      />
    </div>
  {:else if guardViolation}
    <div class="p-4 bg-[var(--color-bmf-50)] rounded-xl border border-[var(--color-bmf-200)] text-[var(--color-bmf-800)] text-sm font-medium" transition:fade>
      Target must be higher than baseline — increase target kcal/oz or lower the baseline.
    </div>
  {:else}
    <div class="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center" transition:fade aria-hidden="true">
      <p class="text-sm font-medium text-[var(--color-text-tertiary)]">Select a brand to calculate.</p>
    </div>
  {/if}

  {#if hasValues}
    <div class="flex justify-center">
      <button
        type="button"
        class="text-2xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-3 py-1.5 rounded-lg min-h-[36px]"
        onclick={clearForm}
      >
        Clear
      </button>
    </div>
  {/if}
</div>
