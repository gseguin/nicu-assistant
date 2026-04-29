// src/lib/uac-uvc/calculator.ts
//
// UAC/UVC catheter depth calculator module — typed
// CalculatorModule<UacUvcStateData>. Bundles metadata, state singleton,
// Calculator + Inputs components, and the recap derivation. Consumed by
// src/routes/uac-uvc/+page.svelte and the shell registry.

import { Ruler } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { UacUvcStateData } from './types.js';
import { uacUvcState } from './state.svelte.js';
import UacUvcCalculator from './UacUvcCalculator.svelte';
import UacUvcInputs from './UacUvcInputs.svelte';

// Single-input calculator — the recap still renders for pattern consistency
// across all 6 calculators (the clinician reads the same shape every time).
function getRecapItems(state: UacUvcStateData): RecapItem[] {
  return [
    {
      label: 'Weight',
      value: state.weightKg === null ? null : `${state.weightKg}`,
      unit: 'kg',
      fullRow: true
    }
  ];
}

export const uacUvcModule: CalculatorModule<UacUvcStateData> = {
  id: 'uac-uvc',
  label: 'UAC/UVC',
  href: '/uac-uvc',
  icon: Ruler,
  description: 'UAC/UVC umbilical catheter depth calculator',
  identityClass: 'identity-uac',
  title: 'UAC/UVC Catheter Depth',
  subtitle: 'cm · weight-based formula',
  inputsLabel: 'UAC/UVC inputs',
  state: uacUvcState,
  Calculator: UacUvcCalculator,
  Inputs: UacUvcInputs,
  getRecapItems
};
