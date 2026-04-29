// src/lib/uac-uvc/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Slice-thin instantiation of CalculatorStore<T> for UAC/UVC.
// Public surface (current, init, persist, reset, lastEdited) is unchanged from
// the pre-migration hand-written singleton — consumers do not need edits.
// See src/lib/shell/calculator-store.svelte.ts for the persistence contract.

import type { UacUvcStateData } from './types.js';
import config from './uac-uvc-config.json';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

function defaultState(): UacUvcStateData {
  return {
    weightKg: config.defaults.weightKg
  };
}

export const uacUvcState = new CalculatorStore<UacUvcStateData>({
  storageKey: 'nicu_uac_uvc_state',
  defaults: defaultState
});
