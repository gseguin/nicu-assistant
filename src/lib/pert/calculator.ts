// src/lib/pert/calculator.ts
//
// PERT calculator module — typed CalculatorModule<PertStateData>. Bundles
// metadata, state singleton, Calculator + Inputs components, and the recap
// derivation function for the PERT slice. Consumed by:
//
// - src/routes/pert/+page.svelte (renders <CalculatorPage module={pertModule} />)
// - src/lib/shell/registry.ts (collected as a CalculatorEntry view)
//
// PERT is the only slice with a mode-conditional recap (oral vs tube-feed);
// the function body is moved verbatim from the previous +page.svelte derivation.

import { Pill } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { PertStateData } from './types.js';
import { pertState } from './state.svelte.js';
import { getFormulaById } from './config.js';
import PertCalculator from './PertCalculator.svelte';
import PertInputs from './PertInputs.svelte';

// Recap surface: weight is shared across both modes (the patient anchor); the
// mode-specific addenda below cover Oral (Fat g) and Tube-Feed (Formula name +
// Volume mL) per UI-SPEC Copywriting Contract. Each mode contributes the
// inputs that drive its hero numeral so the recap reads "what I fed it"
// correctly across mode switches.
function getRecapItems(state: PertStateData): RecapItem[] {
  const items: RecapItem[] = [
    {
      label: 'Weight',
      value: state.weightKg === null ? null : `${state.weightKg}`,
      unit: 'kg',
      fullRow: true
    }
  ];

  if (state.mode === 'oral') {
    items.push({
      label: 'Fat',
      value: state.oral.fatGrams === null ? null : `${state.oral.fatGrams}`,
      unit: 'g'
    });
  } else {
    const formula =
      state.tubeFeed.formulaId === null ? null : getFormulaById(state.tubeFeed.formulaId);
    items.push({
      label: 'Formula',
      value: formula?.name ?? null,
      fullRow: true
    });
    items.push({
      label: 'Volume',
      value: state.tubeFeed.volumePerDayMl === null ? null : `${state.tubeFeed.volumePerDayMl}`,
      unit: 'mL'
    });
  }

  return items;
}

export const pertModule: CalculatorModule<PertStateData> = {
  id: 'pert',
  label: 'PERT',
  href: '/pert',
  icon: Pill,
  description: 'Pediatric EPI PERT calculator',
  identityClass: 'identity-pert',
  title: 'Pediatric EPI PERT Calculator',
  subtitle: 'Capsule dosing · oral & tube-feed modes',
  inputsLabel: 'PERT inputs',
  state: pertState,
  Calculator: PertCalculator,
  Inputs: PertInputs,
  getRecapItems
};
