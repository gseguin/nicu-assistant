// src/lib/gir/calculator.ts
//
// Glucose Infusion Rate calculator module — typed
// CalculatorModule<GirStateData>. Bundles metadata, state singleton, Calculator
// + Inputs components, and the recap derivation. Consumed by
// src/routes/gir/+page.svelte and the shell registry.

import { Droplet } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { GirStateData } from './types.js';
import { girState } from './state.svelte.js';
import GirCalculator from './GirCalculator.svelte';
import GirInputs from './GirInputs.svelte';

function getRecapItems(state: GirStateData): RecapItem[] {
  return [
    {
      label: 'Weight',
      value: state.weightKg === null ? null : `${state.weightKg}`,
      unit: 'kg',
      fullRow: true
    },
    {
      label: 'Dextrose',
      value: state.dextrosePct === null ? null : `${state.dextrosePct}`,
      unit: '%'
    },
    {
      label: 'Fluid rate',
      value: state.mlPerKgPerDay === null ? null : `${state.mlPerKgPerDay}`,
      unit: 'mL/kg/d'
    }
  ];
}

export const girModule: CalculatorModule<GirStateData> = {
  id: 'gir',
  label: 'GIR',
  href: '/gir',
  icon: Droplet,
  description: 'Glucose infusion rate calculator',
  identityClass: 'identity-gir',
  title: 'Glucose Infusion Rate',
  subtitle: 'mg/kg/min · titration helper',
  inputsLabel: 'GIR inputs',
  state: girState,
  Calculator: GirCalculator,
  Inputs: GirInputs,
  getRecapItems
};
