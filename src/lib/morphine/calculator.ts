// src/lib/morphine/calculator.ts
//
// Morphine Wean calculator module — typed CalculatorModule<MorphineStateData>.
// Bundles metadata, state singleton, Calculator + Inputs components, and the
// recap derivation. Consumed by src/routes/morphine-wean/+page.svelte and the
// shell registry.
//
// NB: subtitle is intentionally omitted — the existing route header has only
// an <h1> with no secondary span. CalculatorPage's `{#if mod.subtitle}` skips
// rendering when undefined so the visual matches 1:1.

import { Syringe } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { MorphineStateData } from './types.js';
import { morphineState } from './state.svelte.js';
import MorphineWeanCalculator from './MorphineWeanCalculator.svelte';
import MorphineWeanInputs from './MorphineWeanInputs.svelte';

// Three drivers of the schedule: weight, max dose, step size.
function getRecapItems(state: MorphineStateData): RecapItem[] {
  return [
    {
      label: 'Weight',
      value: state.weightKg === null ? null : `${state.weightKg}`,
      unit: 'kg',
      fullRow: true
    },
    {
      label: 'Max dose',
      value: state.maxDoseMgKgDose === null ? null : `${state.maxDoseMgKgDose}`,
      unit: 'mg/kg'
    },
    {
      label: 'Step',
      value: state.decreasePct === null ? null : `${state.decreasePct}`,
      unit: '%'
    }
  ];
}

export const morphineModule: CalculatorModule<MorphineStateData> = {
  id: 'morphine-wean',
  label: 'Morphine',
  href: '/morphine-wean',
  icon: Syringe,
  description: 'Morphine weaning schedule calculator',
  identityClass: 'identity-morphine',
  title: 'Morphine Wean',
  // subtitle: omitted — existing route has no subtitle span
  inputsLabel: 'Morphine inputs',
  state: morphineState,
  Calculator: MorphineWeanCalculator,
  Inputs: MorphineWeanInputs,
  getRecapItems
};
