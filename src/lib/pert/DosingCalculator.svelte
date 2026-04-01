<!-- src/lib/pert/DosingCalculator.svelte -->
<!-- PERT dosing calculator — meal and tube-feed modes with independent state per mode. -->
<!-- Ported from pert-calculator, refactored to use shared components and pertState module. -->
<script lang="ts">
  import { calculateCapsules, calculateTotalLipase, validateFatGrams } from '$lib/pert/dosing';
  import { MEDICATIONS, LIPASE_RATES, getStrengthsForBrand } from '$lib/pert/medications';
  import {
    TUBE_FEED_LIPASE_RATES,
    TUBE_FEED_MEDICATION_BRANDS,
    getTubeFeedStrengthsForBrand
  } from '$lib/pert/tube-feed/medications';
  import { pertState } from '$lib/pert/state.svelte';
  import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import ResultsDisplay from '$lib/shared/components/ResultsDisplay.svelte';
  import type { SelectOption } from '$lib/shared/types';

  // ── Types ──────────────────────────────────────────────────────────────────

  type CalculatorMode = 'meal' | 'tube-feed';

  type ModeConfig = {
    id: CalculatorMode;
    label: string;
    panelLabel: string;
    panelHeading: string;
    panelBody: string;
    fatLabel: string;
    fatHint: string;
    rateHint: string;
    resultLabel: string;
  };

  // ── Mode configuration ─────────────────────────────────────────────────────

  const MODE_CONFIG: Record<CalculatorMode, ModeConfig> = {
    meal: {
      id: 'meal',
      label: 'Meal',
      panelLabel: 'Meal dosing calculator',
      panelHeading: 'Meal mode',
      panelBody: 'Calculate PERT capsule dosing for a meal based on fat content.',
      fatLabel: 'Fat content',
      fatHint: 'From prescriber or nutrition label',
      rateHint: 'From prescriber or nutrition label',
      resultLabel: 'Dosing results'
    },
    'tube-feed': {
      id: 'tube-feed',
      label: 'Tube Feed',
      panelLabel: 'Tube feed calculator',
      panelHeading: 'Tube feed mode',
      panelBody: 'Calculate PERT capsule dosing for tube feeds with independent inputs.',
      fatLabel: 'Tube-feed fat',
      fatHint: 'Total fat in the tube-feed volume.',
      rateHint: 'From prescriber order.',
      resultLabel: 'Tube-feed dosing results'
    }
  };

  const MODE_ORDER: CalculatorMode[] = ['meal', 'tube-feed'];

  // ── Default brand/strength initialization ──────────────────────────────────

  const mealDefaultStrengths = MEDICATIONS[0]?.strengths ?? [];
  const tubeFeedDefaultBrand = TUBE_FEED_MEDICATION_BRANDS[0] ?? MEDICATIONS[0].brand;
  const tubeFeedDefaultStrengths = getTubeFeedStrengthsForBrand(tubeFeedDefaultBrand);

  // ── Helper functions (mode-agnostic) ───────────────────────────────────────

  function getModeConfig(mode: CalculatorMode): ModeConfig {
    return MODE_CONFIG[mode];
  }

  function getLipaseRates(mode: CalculatorMode): number[] {
    return mode === 'meal' ? LIPASE_RATES : TUBE_FEED_LIPASE_RATES;
  }

  function getBrandOptions(mode: CalculatorMode): SelectOption[] {
    if (mode === 'meal') {
      return MEDICATIONS.map((m) => ({ value: m.brand, label: m.brand }));
    }
    return TUBE_FEED_MEDICATION_BRANDS.map((brand) => ({ value: brand, label: brand }));
  }

  function getStrengths(mode: CalculatorMode, brand: string): number[] {
    return mode === 'meal' ? getStrengthsForBrand(brand) : getTubeFeedStrengthsForBrand(brand);
  }

  function getStrengthOptions(mode: CalculatorMode, brand: string): SelectOption[] {
    return getStrengths(mode, brand).map((s) => ({
      value: String(s),
      label: s.toLocaleString()
    }));
  }

  function getLipaseRateOptions(mode: CalculatorMode): SelectOption[] {
    return getLipaseRates(mode).map((rate) => ({
      value: String(rate),
      label: `${rate.toLocaleString()} units/g`
    }));
  }

  // ── State accessors (read/write pertState.current) ─────────────────────────

  function getModeState(mode: CalculatorMode) {
    return mode === 'meal' ? pertState.current.meal : pertState.current.tubeFeed;
  }

  function parseLipaseRate(lipaseRateStr: string): number {
    return parseInt(lipaseRateStr, 10);
  }

  function parseStrength(strengthStr: string): number {
    return parseInt(strengthStr, 10);
  }

  function parseFatGrams(raw: string): number {
    return parseFloat(raw);
  }

  function getValidationMessage(raw: string): string | null {
    return validateFatGrams(raw);
  }

  function getTotalLipase(fatRaw: string, lipaseRateStr: string): number | null {
    if (getValidationMessage(fatRaw) !== null) return null;
    if (!lipaseRateStr) return null;
    const rate = parseLipaseRate(lipaseRateStr);
    if (isNaN(rate)) return null;
    return calculateTotalLipase(parseFatGrams(fatRaw), rate);
  }

  function getCapsulesNeeded(fatRaw: string, lipaseRateStr: string, strengthStr: string): number | null {
    if (getValidationMessage(fatRaw) !== null) return null;
    if (!lipaseRateStr || !strengthStr) return null;
    const rate = parseLipaseRate(lipaseRateStr);
    const strength = parseStrength(strengthStr);
    if (isNaN(rate) || isNaN(strength)) return null;
    return calculateCapsules(parseFatGrams(fatRaw), rate, strength);
  }

  function getResultPlaceholder(fatRaw: string, _mode: CalculatorMode): string {
    const msg = getValidationMessage(fatRaw);
    if (msg === null) return '';
    if (fatRaw.trim() === '') return 'Enter fat grams to calculate.';
    if (parseFatGrams(fatRaw) === 0) return 'Fat content must be greater than 0 g.';
    return 'Enter a valid fat content to calculate.';
  }

  // ── Derived state for meal mode ────────────────────────────────────────────

  let mealValidationMessage = $derived(getValidationMessage(pertState.current.meal.fatGramsRaw));
  let mealResultPlaceholder = $derived(getResultPlaceholder(pertState.current.meal.fatGramsRaw, 'meal'));
  let mealFatGrams = $derived(parseFatGrams(pertState.current.meal.fatGramsRaw));
  let mealLipaseRate = $derived(parseLipaseRate(pertState.current.meal.lipaseRateStr));
  let mealTotalLipase = $derived(getTotalLipase(pertState.current.meal.fatGramsRaw, pertState.current.meal.lipaseRateStr));
  let mealCapsulesNeeded = $derived(getCapsulesNeeded(pertState.current.meal.fatGramsRaw, pertState.current.meal.lipaseRateStr, pertState.current.meal.selectedStrengthStr));

  // ── Derived state for tube-feed mode ───────────────────────────────────────

  let tubeFeedValidationMessage = $derived(getValidationMessage(pertState.current.tubeFeed.fatGramsRaw));
  let tubeFeedResultPlaceholder = $derived(getResultPlaceholder(pertState.current.tubeFeed.fatGramsRaw, 'tube-feed'));
  let tubeFeedFatGrams = $derived(parseFatGrams(pertState.current.tubeFeed.fatGramsRaw));
  let tubeFeedLipaseRate = $derived(parseLipaseRate(pertState.current.tubeFeed.lipaseRateStr));
  let tubeFeedTotalLipase = $derived(getTotalLipase(pertState.current.tubeFeed.fatGramsRaw, pertState.current.tubeFeed.lipaseRateStr));
  let tubeFeedCapsulesNeeded = $derived(getCapsulesNeeded(pertState.current.tubeFeed.fatGramsRaw, pertState.current.tubeFeed.lipaseRateStr, pertState.current.tubeFeed.selectedStrengthStr));
  let tubeFeedStrength = $derived(parseStrength(pertState.current.tubeFeed.selectedStrengthStr));

  // ── "Has values" check for clear button visibility ─────────────────────────

  let mealHasValues = $derived(
    pertState.current.meal.fatGramsRaw !== '' ||
    pertState.current.meal.lipaseRateStr !== '' ||
    pertState.current.meal.selectedBrand !== '' ||
    pertState.current.meal.selectedStrengthStr !== ''
  );
  let tubeFeedHasValues = $derived(
    pertState.current.tubeFeed.fatGramsRaw !== '' ||
    pertState.current.tubeFeed.lipaseRateStr !== '' ||
    pertState.current.tubeFeed.selectedBrand !== '' ||
    pertState.current.tubeFeed.selectedStrengthStr !== ''
  );

  function clearMode(mode: CalculatorMode) {
    const defaults = { fatGramsRaw: '', lipaseRateStr: '', selectedBrand: '', selectedStrengthStr: '' };
    if (mode === 'meal') {
      Object.assign(pertState.current.meal, defaults);
    } else {
      Object.assign(pertState.current.tubeFeed, defaults);
    }
  }

  // ── Result key tracking for animation ──────────────────────────────────────

  let mealResultKey = $state(0);
  let mealPrevCapsules: number | null = null;
  let tubeFeedResultKey = $state(0);
  let tubeFeedPrevCapsules: number | null = null;

  $effect(() => {
    if (mealCapsulesNeeded !== null && mealCapsulesNeeded !== mealPrevCapsules) {
      mealResultKey += 1;
      mealPrevCapsules = mealCapsulesNeeded;
    }
  });

  $effect(() => {
    if (tubeFeedCapsulesNeeded !== null && tubeFeedCapsulesNeeded !== tubeFeedPrevCapsules) {
      tubeFeedResultKey += 1;
      tubeFeedPrevCapsules = tubeFeedCapsulesNeeded;
    }
  });

  // ── Strength auto-reset when brand changes ─────────────────────────────────

  $effect(() => {
    const strengths = getStrengths('meal', pertState.current.meal.selectedBrand);
    if (strengths.length > 0 && !strengths.includes(parseStrength(pertState.current.meal.selectedStrengthStr))) {
      pertState.current.meal.selectedStrengthStr = String(strengths[0]);
    }
  });

  $effect(() => {
    const strengths = getStrengths('tube-feed', pertState.current.tubeFeed.selectedBrand);
    if (strengths.length > 0 && !strengths.includes(parseStrength(pertState.current.tubeFeed.selectedStrengthStr))) {
      pertState.current.tubeFeed.selectedStrengthStr = String(strengths[0]);
    }
  });

  // ── Persist state on any change ────────────────────────────────────────────

  $effect(() => {
    // Touch all state fields to track them
    JSON.stringify(pertState.current);
    pertState.persist();
  });

  // ── Tab navigation ─────────────────────────────────────────────────────────

  function activateMode(mode: CalculatorMode) {
    pertState.current.activeMode = mode;
  }

  function getModeIndex(mode: CalculatorMode): number {
    return MODE_ORDER.indexOf(mode);
  }

  function focusModeTab(mode: CalculatorMode) {
    const tab = document.getElementById(`calculator-tab-${mode}`);
    if (tab instanceof HTMLButtonElement) {
      tab.focus();
    }
  }

  function handleModeTabKeydown(event: KeyboardEvent, mode: CalculatorMode) {
    const currentIndex = getModeIndex(mode);
    if (currentIndex < 0) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + MODE_ORDER.length) % MODE_ORDER.length;
      const nextMode = MODE_ORDER[nextIndex];
      activateMode(nextMode);
      focusModeTab(nextMode);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const nextMode = event.key === 'Home' ? MODE_ORDER[0] : MODE_ORDER[MODE_ORDER.length - 1];
      activateMode(nextMode);
      focusModeTab(nextMode);
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      activateMode(mode);
    }
  }

  // ── Fat grams input handling (raw string for validation) ───────────────────

  function handleFatInput(mode: CalculatorMode, event: Event) {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const nextValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;

    getModeState(mode).fatGramsRaw = nextValue;
    if (input.value !== nextValue) input.value = nextValue;
  }

  function keepFatFieldVisible(mode: CalculatorMode) {
    const el = document.getElementById(`fat-grams-${mode}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function handleFatFocus(mode: CalculatorMode) {
    keepFatFieldVisible(mode);
  }

  type StepableInput = HTMLInputElement & {
    value: string | null;
    stepUp: () => void;
    stepDown: () => void;
  };

  let mealFatGramsControl = $state<StepableInput | null>(null);
  let tubeFeedFatGramsControl = $state<StepableInput | null>(null);

  function getFatControl(mode: CalculatorMode): StepableInput | null {
    return mode === 'meal' ? mealFatGramsControl : tubeFeedFatGramsControl;
  }

  function handleFatWheel(mode: CalculatorMode, event: WheelEvent) {
    const control = getFatControl(mode);
    if (!control || event.deltaY === 0) return;

    event.preventDefault();

    if (event.deltaY < 0) {
      control.stepUp();
    } else {
      control.stepDown();
    }

    getModeState(mode).fatGramsRaw = control.value ?? '';
  }


</script>

<div class="flex flex-col gap-6">
  <!-- Mode tabs — compact style matching Formula calculator -->
  <div
    class="flex p-1 bg-[var(--color-surface-alt)] rounded-2xl shadow-inner border border-[var(--color-border)]"
    role="tablist"
    aria-label="Calculator mode"
  >
    {#each MODE_ORDER as mode}
      <button
        id={`calculator-tab-${mode}`}
        type="button"
        role="tab"
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-ui outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-light)] {pertState.current.activeMode === mode ? 'bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)]'}"
        aria-selected={pertState.current.activeMode === mode ? 'true' : 'false'}
        aria-controls={`calculator-panel-${mode}`}
        tabindex={pertState.current.activeMode === mode ? 0 : -1}
        onclick={() => activateMode(mode)}
        onkeydown={(event) => handleModeTabKeydown(event, mode)}
      >
        <span>{getModeConfig(mode).label}</span>
      </button>
    {/each}
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- MEAL MODE PANEL                                                        -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div
    id="calculator-panel-meal"
    role="tabpanel"
    aria-labelledby="calculator-tab-meal"
    aria-label={MODE_CONFIG.meal.panelLabel}
    hidden={pertState.current.activeMode !== 'meal'}
    class="space-y-6"
  >
    <section class="card flex flex-col gap-4" aria-label="Meal calculator inputs">
      <!-- Fat grams — raw string input for validation compatibility -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div onclick={() => keepFatFieldVisible('meal')} onkeydown={() => {}}>
        <label for="fat-grams-meal" class="mb-[0.3125rem] block text-xs font-semibold tracking-[0.02em] text-[var(--color-text-secondary)]">
          {MODE_CONFIG.meal.fatLabel}
        </label>
        <div
          class="flex min-h-[3rem] items-center rounded-xl border bg-[var(--color-surface-card)] px-3.5 transition shadow-sm {mealValidationMessage !== null && pertState.current.meal.fatGramsRaw !== '' ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent-light)]'}"
        >
          <input
            bind:this={mealFatGramsControl}
            id="fat-grams-meal"
            type="number"
            min="0"
            max="200"
            step="1"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0"
            value={pertState.current.meal.fatGramsRaw}
            class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base font-medium text-[var(--color-text-primary)] outline-none appearance-none [appearance:textfield]"
            aria-invalid={mealValidationMessage !== null && pertState.current.meal.fatGramsRaw !== '' ? 'true' : undefined}
            oninput={(event) => handleFatInput('meal', event)}
            onfocus={() => handleFatFocus('meal')}
            onwheel={(event) => handleFatWheel('meal', event)}
          />
          <span class="pr-1 text-sm font-medium text-[var(--color-text-tertiary)]" aria-hidden="true">g</span>
        </div>
        {#if mealValidationMessage !== null && pertState.current.meal.fatGramsRaw !== ''}
          <p class="mt-1.5 text-sm text-[var(--color-error)]">{mealValidationMessage}</p>
        {/if}
      </div>

      <!-- Lipase rate -->
      <SelectPicker
        label="Lipase rate (units/g fat)"
        bind:value={pertState.current.meal.lipaseRateStr}
        options={getLipaseRateOptions('meal')}
        class="w-full"
      />

      <!-- Brand & strength -->
      <div class="grid grid-cols-2 gap-4">
        <SelectPicker
          label="Brand"
          bind:value={pertState.current.meal.selectedBrand}
          options={getBrandOptions('meal')}
          class="w-full min-w-0"
        />
        <SelectPicker
          label="Lipase strength"
          bind:value={pertState.current.meal.selectedStrengthStr}
          options={getStrengthOptions('meal', pertState.current.meal.selectedBrand)}
          class="w-full min-w-0"
        />
      </div>
    </section>

    <!-- Results -->
    <section
      aria-label={MODE_CONFIG.meal.resultLabel}
      aria-live="polite"
      aria-atomic="true"
      class="space-y-3"
    >
      {#if mealValidationMessage !== null}
        <!-- Empty state — subtle prompt, no card shape until there's a result -->
        <div class="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center" aria-hidden="true">
          <p class="text-sm font-medium text-[var(--color-text-tertiary)]">
            {mealResultPlaceholder || 'Enter fat grams to calculate.'}
          </p>
        </div>
      {:else}
        <!-- Unified result card — primary + secondary in one block -->
        <div class="bg-[var(--color-accent-result)] border border-[var(--color-accent-result)] px-6 py-5 rounded-3xl flex flex-col justify-between shadow-lg text-white">
          <span class="font-bold uppercase tracking-[0.2em] text-xs text-white/90">Capsules Needed</span>
          {#key mealResultKey}
            <div class="result-block mt-4">
              <div class="flex items-baseline gap-2">
                <span
                  class="capsule-number text-display font-black leading-none num"
                  aria-label={`${mealCapsulesNeeded} capsules needed`}
                >
                  {mealCapsulesNeeded}
                </span>
                <span class="font-bold text-xl text-white/90">capsules</span>
              </div>
            </div>
          {/key}
          <!-- Tertiary: total lipase info -->
          {#if mealTotalLipase}
            <div class="mt-4 pt-3 border-t border-white/25">
              <div class="flex items-baseline gap-1.5 text-ui">
                <span class="text-white/80">Total lipase</span>
                <span class="font-semibold text-white/90 num">{mealTotalLipase.toLocaleString()}</span>
                <span class="text-white/80">units</span>
              </div>
              <span class="text-2xs text-white/75 num">
                {mealFatGrams}g x {mealLipaseRate.toLocaleString()} units/g
              </span>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    {#if mealHasValues}
      <div class="flex justify-center">
        <button
          type="button"
          class="text-2xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-3 py-1.5 rounded-lg min-h-[36px]"
          onclick={() => clearMode('meal')}
        >
          Clear
        </button>
      </div>
    {/if}
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- TUBE-FEED MODE PANEL                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div
    id="calculator-panel-tube-feed"
    role="tabpanel"
    aria-labelledby="calculator-tab-tube-feed"
    aria-label={MODE_CONFIG['tube-feed'].panelLabel}
    hidden={pertState.current.activeMode !== 'tube-feed'}
    class="space-y-6"
  >
    <section class="card flex flex-col gap-4" aria-label="Tube feed calculator inputs">
      <!-- Fat grams — raw string input -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div onclick={() => keepFatFieldVisible('tube-feed')} onkeydown={() => {}}>
        <label for="fat-grams-tube-feed" class="mb-[0.3125rem] block text-xs font-semibold tracking-[0.02em] text-[var(--color-text-secondary)]">
          {MODE_CONFIG['tube-feed'].fatLabel}
        </label>
        <div
          class="flex min-h-[3rem] items-center rounded-xl border bg-[var(--color-surface-card)] px-3.5 transition shadow-sm {tubeFeedValidationMessage !== null && pertState.current.tubeFeed.fatGramsRaw !== '' ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent-light)]'}"
        >
          <input
            bind:this={tubeFeedFatGramsControl}
            id="fat-grams-tube-feed"
            type="number"
            min="0"
            max="200"
            step="1"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0"
            value={pertState.current.tubeFeed.fatGramsRaw}
            class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base font-medium text-[var(--color-text-primary)] outline-none appearance-none [appearance:textfield]"
            aria-invalid={tubeFeedValidationMessage !== null && pertState.current.tubeFeed.fatGramsRaw !== '' ? 'true' : undefined}
            oninput={(event) => handleFatInput('tube-feed', event)}
            onfocus={() => handleFatFocus('tube-feed')}
            onwheel={(event) => handleFatWheel('tube-feed', event)}
          />
          <span class="pr-1 text-sm font-medium text-[var(--color-text-tertiary)]" aria-hidden="true">g</span>
        </div>
        {#if tubeFeedValidationMessage !== null && pertState.current.tubeFeed.fatGramsRaw !== ''}
          <p class="mt-1.5 text-sm text-[var(--color-error)]">{tubeFeedValidationMessage}</p>
        {/if}
      </div>

      <!-- Lipase rate -->
      <SelectPicker
        label="Lipase rate (units/g fat)"
        bind:value={pertState.current.tubeFeed.lipaseRateStr}
        options={getLipaseRateOptions('tube-feed')}
        class="w-full"
      />

      <!-- Brand & strength -->
      <div class="grid grid-cols-2 gap-4">
        <SelectPicker
          label="Medication"
          bind:value={pertState.current.tubeFeed.selectedBrand}
          options={getBrandOptions('tube-feed')}
          class="w-full min-w-0"
        />
        <SelectPicker
          label="Medication strength"
          bind:value={pertState.current.tubeFeed.selectedStrengthStr}
          options={getStrengthOptions('tube-feed', pertState.current.tubeFeed.selectedBrand)}
          class="w-full min-w-0"
        />
      </div>
    </section>

    <!-- Results -->
    <section
      aria-label={MODE_CONFIG['tube-feed'].resultLabel}
      aria-live="polite"
      aria-atomic="true"
      class="space-y-3"
    >
      {#if tubeFeedValidationMessage !== null}
        <!-- Empty state — subtle prompt, no card shape until there's a result -->
        <div class="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center" aria-hidden="true">
          <p class="text-sm font-medium text-[var(--color-text-tertiary)]">
            {tubeFeedResultPlaceholder || 'Enter fat grams to calculate.'}
          </p>
        </div>
      {:else}
        <!-- Unified result card — primary + secondary in one block -->
        <div class="bg-[var(--color-accent-result)] border border-[var(--color-accent-result)] px-6 py-5 rounded-3xl flex flex-col justify-between shadow-lg text-white">
          <span class="font-bold uppercase tracking-[0.2em] text-xs text-white/90">Capsules Needed</span>
          {#key tubeFeedResultKey}
            <div class="result-block mt-4">
              <div class="flex items-baseline gap-2">
                <span
                  class="capsule-number text-display font-black leading-none num"
                  aria-label={`${tubeFeedCapsulesNeeded} tube-feed capsules needed`}
                >
                  {tubeFeedCapsulesNeeded}
                </span>
                <span class="font-bold text-xl text-white/90">capsules</span>
              </div>
            </div>
          {/key}
          <!-- Tertiary: total lipase info -->
          {#if tubeFeedTotalLipase}
            <div class="mt-4 pt-3 border-t border-white/25">
              <div class="flex items-baseline gap-1.5 text-ui">
                <span class="text-white/80">Total lipase</span>
                <span class="font-semibold text-white/90 num">{tubeFeedTotalLipase.toLocaleString()}</span>
                <span class="text-white/80">units</span>
              </div>
              <span class="text-2xs text-white/75 num">
                {tubeFeedFatGrams}g x {tubeFeedLipaseRate.toLocaleString()} units/g
              </span>
              <span class="block text-2xs text-white/75 num">
                Using {tubeFeedStrength.toLocaleString()} units/capsule
              </span>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    {#if tubeFeedHasValues}
      <div class="flex justify-center">
        <button
          type="button"
          class="text-2xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-3 py-1.5 rounded-lg min-h-[36px]"
          onclick={() => clearMode('tube-feed')}
        >
          Clear
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  :root {
    --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  }

  .capsule-number {
    animation: number-pop 280ms var(--ease-out-quart) both;
  }

  @keyframes number-pop {
    from { opacity: 0; transform: translateY(6px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .result-block {
    animation: fade-in 240ms var(--ease-out-quart) both;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Hide HTML5 number spinners for clinical UI */
  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .capsule-number,
    .result-block {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
