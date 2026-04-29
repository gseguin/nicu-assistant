// src/lib/gir/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Slice-thin instantiation of CalculatorStore<T> for GIR.
// Public surface (current, init, persist, reset, lastEdited) is unchanged from
// the pre-migration hand-written singleton — consumers do not need edits.
// See src/lib/shell/calculator-store.svelte.ts for the persistence contract.

import type { GirStateData } from './types.js';
import config from './gir-config.json';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

function defaultState(): GirStateData {
  return {
    weightKg: config.defaults.weightKg,
    dextrosePct: config.defaults.dextrosePct,
    mlPerKgPerDay: config.defaults.mlPerKgPerDay,
    selectedBucketId: null
  };
}

export const girState = new CalculatorStore<GirStateData>({
  storageKey: 'nicu_gir_state',
  defaults: defaultState
});
