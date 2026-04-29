// src/lib/feeds/calculator.ts
//
// Feed Advance calculator module — typed CalculatorModule<FeedsStateData>.
// Bundles metadata, state singleton, Calculator + Inputs components, and the
// recap derivation. Consumed by src/routes/feeds/+page.svelte and the shell
// registry.

import { Baby } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { FeedsStateData } from './types.js';
import { feedsState } from './state.svelte.js';
import FeedAdvanceCalculator from './FeedAdvanceCalculator.svelte';
import FeedAdvanceInputs from './FeedAdvanceInputs.svelte';

// Feeds has the deepest drawer by input count (weight + mode-toggle + per-mode);
// the recap surfaces the two top-level drivers (mode + weight), everything else
// is a modifier that lives in the drawer.
function getRecapItems(state: FeedsStateData): RecapItem[] {
  return [
    {
      label: 'Weight',
      value: state.weightKg === null ? null : `${state.weightKg}`,
      unit: 'kg',
      fullRow: true
    },
    { label: 'Mode', value: state.mode === 'bedside' ? 'Bedside' : 'Full Nutrition' }
  ];
}

export const feedsModule: CalculatorModule<FeedsStateData> = {
  id: 'feeds',
  label: 'Feeds',
  href: '/feeds',
  icon: Baby,
  description: 'Feed advance calculator',
  identityClass: 'identity-feeds',
  title: 'Feed Advance Calculator',
  subtitle: 'bedside volumes + nutrition totals',
  inputsLabel: 'Feeds inputs',
  state: feedsState,
  Calculator: FeedAdvanceCalculator,
  Inputs: FeedAdvanceInputs,
  getRecapItems
};
