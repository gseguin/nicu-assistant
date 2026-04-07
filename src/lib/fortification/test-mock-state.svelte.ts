// Test-only reactive mock state for FortificationCalculator tests.
// Uses $state so post-render mutations drive component reactivity.
// Not imported by production code.

import type { BaseType, UnitType, TargetKcalOz } from './types.js';

export interface MockFortificationState {
  base: BaseType;
  volumeMl: number | null;
  formulaId: string;
  targetKcalOz: TargetKcalOz;
  unit: UnitType;
}

export const mockState = $state<MockFortificationState>({
  base: 'breast-milk',
  volumeMl: 180,
  formulaId: 'neocate-infant',
  targetKcalOz: 24,
  unit: 'teaspoons',
});

export function resetMockState(): void {
  mockState.base = 'breast-milk';
  mockState.volumeMl = 180;
  mockState.formulaId = 'neocate-infant';
  mockState.targetKcalOz = 24;
  mockState.unit = 'teaspoons';
}
