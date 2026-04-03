<script lang="ts">
  import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import ResultsDisplay from '$lib/shared/components/ResultsDisplay.svelte';
  import { BRANDS, type BrandConfig, getBrandById } from '$lib/formula/formula-config.js';
  import { calculateRecipe, validateRecipeInputs } from '$lib/formula/formula.js';
  import { formulaState } from '$lib/formula/state.svelte.js';
  import type { SelectOption } from '$lib/shared/types.js';
  import { AlertCircle } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  // Brand options mapped for SelectPicker (CRITICAL: use `value`, not `id`)
  const brandOptions: SelectOption[] = BRANDS.map(b => ({
    value: b.id,
    label: b.brand,
    group: b.manufacturer
  }));

  // Local numeric state synced with string-based formulaState
  let targetKcalOz = $state<number | null>(
    formulaState.current.modified.targetKcalOzRaw
      ? parseFloat(formulaState.current.modified.targetKcalOzRaw)
      : null
  );
  let volumeMl = $state<number | null>(
    formulaState.current.modified.volumeMlRaw
      ? parseFloat(formulaState.current.modified.volumeMlRaw)
      : 120
  );

  // Sync local numeric values back to string state
  $effect(() => {
    formulaState.current.modified.targetKcalOzRaw = targetKcalOz === null ? '' : String(targetKcalOz);
  });
  $effect(() => {
    formulaState.current.modified.volumeMlRaw = volumeMl === null ? '' : String(volumeMl);
  });

  // Resolve selected brand from state
  const selectedBrand = $derived<BrandConfig | undefined>(
    formulaState.current.modified.selectedBrandId
      ? getBrandById(formulaState.current.modified.selectedBrandId)
      : undefined
  );

  // Inline guidance when values are entered but no brand is selected
  const noBrandHint = $derived(
    !formulaState.current.modified.selectedBrandId && (targetKcalOz !== null || volumeMl !== null)
      ? 'Select a formula brand to calculate.'
      : ''
  );

  // Derived recipe calculation (preserving $derived.by pattern)
  const { recipe, calcError } = $derived.by(() => {
    if (!selectedBrand || targetKcalOz === null || volumeMl === null) {
      return { recipe: null, calcError: null };
    }
    const validation = validateRecipeInputs(targetKcalOz, volumeMl);
    if (!validation.valid) {
      return { recipe: null, calcError: validation.errors[0] };
    }
    try {
      return { recipe: calculateRecipe(selectedBrand, targetKcalOz, volumeMl), calcError: null };
    } catch (e) {
      return { recipe: null, calcError: e instanceof Error ? e.message : 'Calculation failed' };
    }
  });

  const hasValues = $derived(
    formulaState.current.modified.selectedBrandId !== '' ||
    targetKcalOz !== null ||
    (volumeMl !== null && volumeMl !== 120)
  );

  function clearForm() {
    formulaState.current.modified.selectedBrandId = '';
    formulaState.current.modified.targetKcalOzRaw = '';
    formulaState.current.modified.volumeMlRaw = '';
    targetKcalOz = null;
    volumeMl = 120;
  }
</script>

<div class="space-y-6">
  <!-- Inputs Section -->
  <div class="card space-y-4">
    <SelectPicker
      label="Formula Brand"
      bind:value={formulaState.current.modified.selectedBrandId}
      options={brandOptions}
      placeholder="Select Brand..."
    />
    {#if noBrandHint}
      <p class="text-xs text-[var(--color-text-secondary)] ml-1 -mt-2" transition:slide={{ duration: 150 }}>{noBrandHint}</p>
    {/if}

    <div class="grid grid-cols-2 gap-4">
      <NumericInput
        bind:value={targetKcalOz}
        label="Desired kcal/oz"
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
        secondaryValue={String(recipe.mL_water)}
        secondaryUnit="mL"
        secondaryLabel="water"
        accentVariant="clinical"
        dispensingMeasures={[
          ...(recipe.scoops !== null ? [{ label: 'Scoops', value: recipe.scoops }] : []),
          ...(recipe.packets !== null ? [{ label: 'Packets', value: recipe.packets }] : []),
          ...(recipe.tbsp !== null ? [{ label: 'Tbsp', value: recipe.tbsp }] : []),
          ...(recipe.tsp !== null ? [{ label: 'Tsp', value: recipe.tsp }] : []),
        ]}
      />
    </div>
  {:else}
    <div class="rounded-2xl bg-[var(--color-surface-alt)] px-6 py-10 text-center flex flex-col items-center gap-3" transition:fade aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)] opacity-50"><path d="M10 2v4"/><path d="M14 2v4"/><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M4 10h16"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>
      <p class="text-sm font-medium text-[var(--color-text-secondary)]">Choose a formula brand above to see the recipe.</p>
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
