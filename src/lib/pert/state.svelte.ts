// src/lib/pert/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Slice-thin instantiation of CalculatorStore<T> for PERT.
// Public surface (current, init, persist, reset, lastEdited) is unchanged from
// the pre-migration hand-written singleton — consumers do not need edits.
//
// PERT is the only slice that passes a custom `merge` to CalculatorStore.
// PertStateData has nested oral and tubeFeed sub-objects; defensive merge
// keeps them intact when stored JSON has partial data (older schema, etc.).
// CONTEXT D-09..D-13.
//
// See src/lib/shell/calculator-store.svelte.ts for the persistence contract.

import type { PertStateData } from './types.js';
import { defaults as configDefaults } from './config.js';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

function defaultState(): PertStateData {
  // Deep clone so mutating .current doesn't bleed into the imported defaults.
  return {
    mode: configDefaults.mode,
    weightKg: configDefaults.weightKg,
    medicationId: configDefaults.medicationId,
    strengthValue: configDefaults.strengthValue,
    oral: { ...configDefaults.oral },
    tubeFeed: { ...configDefaults.tubeFeed }
  };
}

export const pertState = new CalculatorStore<PertStateData>({
  storageKey: 'nicu_pert_state',
  defaults: defaultState,
  merge: (defaults, parsed) => ({
    ...defaults,
    ...parsed,
    oral: { ...defaults.oral, ...(parsed.oral ?? {}) },
    tubeFeed: { ...defaults.tubeFeed, ...(parsed.tubeFeed ?? {}) }
  })
});
