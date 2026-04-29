// src/lib/fortification/calculator.ts
//
// Formula Recipe (fortification) calculator module — typed
// CalculatorModule<FortificationStateData>. Bundles metadata, state singleton,
// Calculator + Inputs components, and the recap derivation. Consumed by
// src/routes/formula/+page.svelte (route id stays 'formula' even though the
// slice/module name is 'fortification') and the shell registry.
//
// NB 1: FortificationStateData is exported from state.svelte.ts itself
// (not from types.ts) — this slice is the only one with that quirk.
//
// NB 2: getFormulaById lives in fortification-config.js (not config.js as in
// the PERT slice) — distinct module path.
//
// NB 3: subtitle is intentionally omitted — the existing route header has
// only an <h1> with no secondary span.

import { Milk } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { FortificationStateData } from './state.svelte.js';
import { fortificationState } from './state.svelte.js';
import { getFormulaById } from './fortification-config.js';
import FortificationCalculator from './FortificationCalculator.svelte';
import FortificationInputs from './FortificationInputs.svelte';

// Recap items: formula, base, volume, target. First item (formula name) gets
// flex:2 in InputsRecap to accommodate longer names like "Similac Special
// Care 30 w/ Iron".
function getRecapItems(state: FortificationStateData): RecapItem[] {
  const formula = getFormulaById(state.formulaId);
  return [
    { label: 'Formula', value: formula?.name ?? null },
    { label: 'Base', value: state.base === 'breast-milk' ? 'Breast milk' : 'Water' },
    {
      label: 'Volume',
      value: state.volumeMl === null ? null : `${state.volumeMl}`,
      unit: 'mL'
    },
    { label: 'Target', value: `${state.targetKcalOz}`, unit: 'kcal/oz' }
  ];
}

export const fortificationModule: CalculatorModule<FortificationStateData> = {
  id: 'formula',
  label: 'Formula',
  href: '/formula',
  icon: Milk,
  description: 'Infant formula fortification calculator',
  identityClass: 'identity-formula',
  title: 'Formula Recipe',
  // subtitle: omitted — existing route has no subtitle span
  inputsLabel: 'Formula inputs',
  state: fortificationState,
  Calculator: FortificationCalculator,
  Inputs: FortificationInputs,
  getRecapItems
};
