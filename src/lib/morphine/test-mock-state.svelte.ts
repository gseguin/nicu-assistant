// Test-only reactive mock state for MorphineWeanCalculator tests.
// Uses $state so bind:value bindings don't trigger binding_property_non_reactive warnings.
// Not imported by production code.

import type { MorphineStateData } from './types.js';

export const mockState = $state<MorphineStateData>({
  weightKg: null,
  maxDoseMgKgDose: null,
  decreasePct: null,
});

export function resetMockState(): void {
  mockState.weightKg = null;
  mockState.maxDoseMgKgDose = null;
  mockState.decreasePct = null;
}
