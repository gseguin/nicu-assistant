// src/lib/fortification/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Slice-thin instantiation of CalculatorStore<T> for Fortification.
// Public surface (current, init, persist, reset, lastEdited) is unchanged from
// the pre-migration hand-written singleton — consumers do not need edits.
// See src/lib/shell/calculator-store.svelte.ts for the persistence contract.

import type { BaseType, UnitType, TargetKcalOz } from './types.js';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

export interface FortificationStateData {
  base: BaseType;
  volumeMl: number | null;
  formulaId: string;
  targetKcalOz: TargetKcalOz;
  unit: UnitType;
}

function defaultState(): FortificationStateData {
  return {
    base: 'breast-milk',
    volumeMl: 180,
    formulaId: 'neocate-infant',
    targetKcalOz: 24,
    unit: 'teaspoons'
  };
}

export const fortificationState = new CalculatorStore<FortificationStateData>({
  storageKey: 'nicu_fortification_state',
  defaults: defaultState
});
