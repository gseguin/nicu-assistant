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
      fatHint: 'Direct gram entry for tube-feed dosing.',
      rateHint: 'Shared dosing helpers remain the source of truth for tube-feed results.',
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
    return calculateTotalLipase(parseFatGrams(fatRaw), parseLipaseRate(lipaseRateStr));
  }

  function getCapsulesNeeded(fatRaw: string, lipaseRateStr: string, strengthStr: string): number | null {
    if (getValidationMessage(fatRaw) !== null) return null;
    return calculateCapsules(parseFatGrams(fatRaw), parseLipaseRate(lipaseRateStr), parseStrength(strengthStr));
  }

  function getResultPlaceholder(fatRaw: string, mode: CalculatorMode): string {
    const msg = getValidationMessage(fatRaw);
    if (msg === null) return '';
    if (fatRaw.trim() === '') return 'Enter fat grams above.';
    if (parseFatGrams(fatRaw) === 0) {
      return mode === 'meal'
        ? 'Enter more than 0 g to calculate dosing.'
        : 'Enter more than 0 g to calculate tube-feed dosing.';
    }
    return mode === 'meal' ? 'Fix fat grams to see dosing.' : 'Fix fat grams to see tube-feed dosing.';
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

  // ── PERT tooltip ───────────────────────────────────────────────────────────

  let pertTooltipOpen = $state(false);
  let pertTooltipTrigger = $state<HTMLButtonElement | null>(null);

  function togglePertTooltip() {
    pertTooltipOpen = !pertTooltipOpen;
  }

  // Close tooltip on outside click / escape
  function handleDocumentClick(event: MouseEvent) {
    if (!pertTooltipOpen) return;
    const target = event.target;
    if (target instanceof Node && pertTooltipTrigger?.contains(target)) return;
    pertTooltipOpen = false;
  }

  function handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      pertTooltipOpen = false;
    }
  }
</script>

<svelte:document onclick={handleDocumentClick} onkeydown={handleDocumentKeyDown} />

<div class="flex flex-col gap-6">
  <!-- Header -->
  <header class="anim-header flex items-baseline gap-2" aria-label="PERT Dosing Calculator">
    <div class="relative">
      <button
        bind:this={pertTooltipTrigger}
        id="pert-acronym-trigger"
        type="button"
        class="pert-tooltip-trigger"
        aria-label="PERT: Pancreatic Enzyme Replacement Therapy"
        aria-expanded={pertTooltipOpen ? 'true' : 'false'}
        onclick={togglePertTooltip}
      >
        <span aria-hidden="true">PERT</span>
      </button>
      {#if pertTooltipOpen}
        <div
          role="tooltip"
          class="pert-tooltip absolute top-full left-0 mt-1.5 z-50 w-max px-2.5 py-1.5 text-xs font-medium"
        >
          Pancreatic Enzyme Replacement Therapy
        </div>
      {/if}
    </div>
    <span class="text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-[var(--color-text-tertiary)]">
      Dosing Calculator
    </span>
  </header>

  <!-- Mode tabs -->
  <section class="anim-inputs" aria-label="Calculator mode switch">
    <div
      role="tablist"
      aria-label="Calculator mode"
      class="tab-shell grid grid-cols-2 gap-2 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2"
    >
      {#each MODE_ORDER as mode}
        <button
          id={`calculator-tab-${mode}`}
          type="button"
          role="tab"
          class="tab-trigger rounded-[0.95rem] px-4 py-3.5 text-left transition"
          class:is-active={pertState.current.activeMode === mode}
          aria-selected={pertState.current.activeMode === mode ? 'true' : 'false'}
          aria-controls={`calculator-panel-${mode}`}
          tabindex={pertState.current.activeMode === mode ? 0 : -1}
          onclick={() => activateMode(mode)}
          onkeydown={(event) => handleModeTabKeydown(event, mode)}
        >
          <span class="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            {getModeConfig(mode).label}
          </span>
          <span class="mt-1 block text-sm font-medium text-[var(--color-text-primary)]">
            {getModeConfig(mode).panelHeading}
          </span>
          <span class="mt-1 block text-[0.6875rem] leading-5 text-[var(--color-text-secondary)]">
            {mode === 'meal'
              ? 'Standard meal dosing workflow.'
              : 'Tube-feed dosing with independent inputs.'}
          </span>
        </button>
      {/each}
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- MEAL MODE PANEL                                                        -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div
    id="calculator-panel-meal"
    role="tabpanel"
    aria-labelledby="calculator-tab-meal"
    aria-label={MODE_CONFIG.meal.panelLabel}
    hidden={pertState.current.activeMode !== 'meal'}
  >
    <div class="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-3">
      <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {MODE_CONFIG.meal.panelHeading}
      </p>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">{MODE_CONFIG.meal.panelBody}</p>
    </div>

    <section class="flex flex-col gap-4 mb-6" aria-label="Meal calculator inputs">
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
        <p class="mt-1.5 text-[0.6875rem] font-normal text-[var(--color-text-tertiary)]">{MODE_CONFIG.meal.fatHint}</p>
      </div>

      <!-- Lipase rate -->
      <div>
        <SelectPicker
          label="Lipase rate (units/g fat)"
          bind:value={pertState.current.meal.lipaseRateStr}
          options={getLipaseRateOptions('meal')}
          class="w-full"
        />
        <p class="mt-1.5 text-[0.6875rem] font-normal text-[var(--color-text-tertiary)]">{MODE_CONFIG.meal.rateHint}</p>
      </div>

      <!-- Brand & strength -->
      <div class="grid grid-cols-2 gap-3">
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
      class="anim-results flex flex-col gap-[0.875rem] rounded-lg bg-[var(--color-surface-alt)] px-4 py-4"
      aria-label={MODE_CONFIG.meal.resultLabel}
      aria-live="polite"
      aria-atomic="true"
    >
      {#if mealValidationMessage !== null}
        <p class="result-placeholder text-sm font-normal text-[var(--color-text-tertiary)] pt-1">{mealResultPlaceholder}</p>
      {:else}
        <div class="result-block flex flex-col gap-[0.1875rem]">
          <span class="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--color-text-tertiary)]">
            Capsules needed
          </span>
          {#key mealResultKey}
            <span
              class="capsule-number text-[clamp(3.5rem,18vw,5rem)] font-bold leading-none text-[var(--color-text-primary)] tracking-[-0.02em] num"
              aria-label={`${mealCapsulesNeeded} capsules needed`}
            >
              {mealCapsulesNeeded}
            </span>
          {/key}
        </div>
        <div class="result-meta flex flex-col gap-[0.125rem] pt-[0.125rem]">
          <div class="flex items-baseline gap-[0.3125rem]">
            <span class="text-xs font-medium text-[var(--color-text-tertiary)] tracking-[0.01em]">Total lipase</span>
            <span class="text-base font-semibold text-[var(--color-text-secondary)] num">
              {mealTotalLipase?.toLocaleString()}
            </span>
            <span class="text-xs font-normal text-[var(--color-text-tertiary)]">units</span>
          </div>
          <span class="text-[0.6875rem] font-normal text-[var(--color-text-tertiary)] num">
            {mealFatGrams}g x {mealLipaseRate.toLocaleString()} units/g
          </span>
        </div>
      {/if}
    </section>
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
  >
    <div class="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-3">
      <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {MODE_CONFIG['tube-feed'].panelHeading}
      </p>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">{MODE_CONFIG['tube-feed'].panelBody}</p>
    </div>

    <section class="flex flex-col gap-4 mb-6" aria-label="Tube feed calculator inputs">
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
        <p class="mt-1.5 text-[0.6875rem] font-normal text-[var(--color-text-tertiary)]">{MODE_CONFIG['tube-feed'].fatHint}</p>
      </div>

      <!-- Lipase rate -->
      <div>
        <SelectPicker
          label="Lipase rate (units/g fat)"
          bind:value={pertState.current.tubeFeed.lipaseRateStr}
          options={getLipaseRateOptions('tube-feed')}
          class="w-full"
        />
        <p class="mt-1.5 text-[0.6875rem] font-normal text-[var(--color-text-tertiary)]">
          {MODE_CONFIG['tube-feed'].rateHint}
        </p>
      </div>

      <!-- Brand & strength -->
      <div class="grid grid-cols-2 gap-3">
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
      class="anim-results flex flex-col gap-[0.875rem] rounded-lg bg-[var(--color-surface-alt)] px-4 py-4"
      aria-label={MODE_CONFIG['tube-feed'].resultLabel}
      aria-live="polite"
      aria-atomic="true"
    >
      {#if tubeFeedValidationMessage !== null}
        <p class="result-placeholder text-sm font-normal text-[var(--color-text-tertiary)] pt-1">
          {tubeFeedResultPlaceholder}
        </p>
      {:else}
        <div class="result-block flex flex-col gap-[0.1875rem]">
          <span class="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--color-text-tertiary)]">
            Tube-feed capsules needed
          </span>
          {#key tubeFeedResultKey}
            <span
              class="capsule-number text-[clamp(3.5rem,18vw,5rem)] font-bold leading-none text-[var(--color-text-primary)] tracking-[-0.02em] num"
              aria-label={`${tubeFeedCapsulesNeeded} tube-feed capsules needed`}
            >
              {tubeFeedCapsulesNeeded}
            </span>
          {/key}
        </div>
        <div class="result-meta flex flex-col gap-[0.125rem] pt-[0.125rem]">
          <div class="flex items-baseline gap-[0.3125rem]">
            <span class="text-xs font-medium text-[var(--color-text-tertiary)] tracking-[0.01em]">Total lipase</span>
            <span class="text-base font-semibold text-[var(--color-text-secondary)] num">
              {tubeFeedTotalLipase?.toLocaleString()}
            </span>
            <span class="text-xs font-normal text-[var(--color-text-tertiary)]">units</span>
          </div>
          <span class="text-[0.6875rem] font-normal text-[var(--color-text-tertiary)] num">
            {tubeFeedFatGrams}g x {tubeFeedLipaseRate.toLocaleString()} units/g
          </span>
          <span class="text-[0.6875rem] font-normal text-[var(--color-text-tertiary)] num">
            Using {tubeFeedStrength.toLocaleString()} units/capsule
          </span>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  :root {
    --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  }

  .anim-header,
  .anim-inputs,
  .anim-results {
    animation: slide-up 420ms var(--ease-out-expo) both;
  }

  .anim-header { animation-delay: 0ms; }
  .anim-inputs { animation-delay: 40ms; }
  .anim-results { animation-delay: 80ms; }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .capsule-number {
    animation: number-pop 280ms var(--ease-out-quart) both;
  }

  @keyframes number-pop {
    from { opacity: 0; transform: translateY(6px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .tab-shell {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 12px 28px rgba(15, 23, 42, 0.08);
  }

  .tab-trigger {
    width: 100%;
    min-height: 5.25rem;
    border: 1px solid transparent;
    background: transparent;
    box-shadow: none;
  }

  .tab-trigger:hover {
    border-color: color-mix(in srgb, var(--color-accent) 22%, var(--color-border) 78%);
    background: color-mix(in srgb, var(--color-surface-card) 86%, transparent 14%);
  }

  .tab-trigger:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 0.125rem;
  }

  .tab-trigger.is-active {
    border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border) 72%);
    background: color-mix(in srgb, var(--color-surface-card) 88%, var(--color-accent) 12%);
    box-shadow:
      0 12px 24px rgba(37, 99, 235, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .pert-tooltip-trigger {
    display: inline-flex;
    align-items: center;
    appearance: none;
    background: transparent;
    border: 0;
    padding: 0;
    margin: 0;
    color: var(--color-accent);
    font: inherit;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    line-height: inherit;
    cursor: pointer;
  }

  .pert-tooltip-trigger:focus-visible {
    outline: 2px solid var(--color-accent-light);
    outline-offset: 0.125rem;
    border-radius: 0.1875rem;
  }

  .pert-tooltip {
    border: 1px solid color-mix(in srgb, var(--color-border) 78%, white 22%);
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-surface-card) 82%, white 18%);
    color: var(--color-text-primary);
    box-shadow:
      0 10px 24px rgba(15, 23, 42, 0.18),
      0 2px 6px rgba(15, 23, 42, 0.1);
  }

  :global(.dark) .pert-tooltip {
    border-color: color-mix(in srgb, var(--color-accent) 24%, var(--color-border) 76%);
    background: color-mix(in srgb, var(--color-surface-card) 68%, black 32%);
    box-shadow:
      0 14px 32px rgba(2, 6, 23, 0.55),
      0 0 0 1px rgba(148, 163, 184, 0.08);
  }

  .result-block {
    animation: fade-in 240ms var(--ease-out-quart) both;
  }

  .result-meta {
    animation: fade-in 240ms var(--ease-out-quart) 60ms both;
  }

  .result-placeholder {
    animation: fade-in 200ms var(--ease-out-quart) both;
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
    .anim-header,
    .anim-inputs,
    .anim-results,
    .capsule-number,
    .result-block,
    .result-meta,
    .result-placeholder {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
