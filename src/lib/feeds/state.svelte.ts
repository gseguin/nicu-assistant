// src/lib/feeds/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Slice-thin instantiation of CalculatorStore<T> for Feed Advance.
// Public surface (current, init, persist, reset, lastEdited) is unchanged from
// the pre-migration hand-written singleton — consumers do not need edits.
// See src/lib/shell/calculator-store.svelte.ts for the persistence contract.

import type { FeedsStateData } from './types.js';
import { defaults } from './feeds-config.js';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

function defaultState(): FeedsStateData {
  return {
    mode: 'bedside',
    weightKg: defaults.weightKg,
    // Bedside defaults from config
    trophicMlKgDay: defaults.trophicMlKgDay,
    advanceMlKgDay: defaults.advanceMlKgDay,
    goalMlKgDay: defaults.goalMlKgDay,
    trophicFrequency: 'q3h',
    advanceCadence: 'bid',
    totalFluidsMlHr: null,
    // Full nutrition defaults from config
    tpnDex1Pct: defaults.tpnDex1Pct,
    tpnMl1Hr: defaults.tpnMl1Hr,
    tpnDex2Pct: defaults.tpnDex2Pct,
    tpnMl2Hr: defaults.tpnMl2Hr,
    smofMl: defaults.smofMl,
    enteralMl: defaults.enteralMl,
    enteralKcalPerOz: defaults.enteralKcalPerOz
  };
}

export const feedsState = new CalculatorStore<FeedsStateData>({
  storageKey: 'nicu_feeds_state',
  defaults: defaultState
});
