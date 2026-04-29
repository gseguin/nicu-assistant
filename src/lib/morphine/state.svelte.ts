// src/lib/morphine/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Slice-thin instantiation of CalculatorStore<T> for Morphine wean.
// Public surface (current, init, persist, reset, lastEdited) is unchanged from
// the pre-migration hand-written singleton — consumers do not need edits.
// See src/lib/shell/calculator-store.svelte.ts for the persistence contract.

import type { MorphineStateData } from './types.js';
import config from './morphine-config.json';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

function defaultState(): MorphineStateData {
  return {
    weightKg: config.defaults.weightKg,
    maxDoseMgKgDose: config.defaults.maxDoseMgKgDose,
    decreasePct: config.defaults.decreasePct
  };
}

export const morphineState = new CalculatorStore<MorphineStateData>({
  storageKey: 'nicu_morphine_state',
  defaults: defaultState
});
