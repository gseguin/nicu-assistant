// src/lib/fortification/FortificationInputs.test.ts
// Co-located component test for the inputs fragment extracted in Plan 42.1-05 (D-08).
// Mirrors the input-field + packets/availability assertions that previously lived in
// FortificationCalculator.test.ts.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';

import { mockState, resetMockState } from './test-mock-state.svelte.js';

vi.mock('$lib/fortification/state.svelte.js', () => ({
  fortificationState: {
    get current() {
      return mockState;
    },
    init: vi.fn(),
    persist: vi.fn(),
    reset: vi.fn(() => resetMockState())
  }
}));

import FortificationInputs from './FortificationInputs.svelte';

describe('FortificationInputs', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('renders all 5 inputs with correct labels', () => {
    render(FortificationInputs);
    // NumericInput uses <label for=> -> getByLabelText works
    expect(screen.getByLabelText('Starting Volume')).toBeTruthy();
    // SelectPickers are labeled via aria-labelledby pointing at the visible label span
    expect(screen.getByLabelText('Base')).toBeTruthy();
    expect(screen.getByLabelText('Formula')).toBeTruthy();
    expect(screen.getByLabelText('Target Calorie')).toBeTruthy();
    expect(screen.getByLabelText('Unit')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('Packets option is hidden from the Unit picker when formula is not Similac HMF', async () => {
    mockState.formulaId = 'neocate-infant';
    render(FortificationInputs);
    await tick();
    const unitTrigger = screen.getByLabelText('Unit');
    expect(unitTrigger.textContent ?? '').not.toContain('Packets');
    expect(screen.queryByText(/^Packets$/)).toBeNull();
  });

  it('Packets option is available + auto-selected when formula is Similac HMF', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationInputs);
    await tick();
    const unitTrigger = screen.getByLabelText('Unit');
    expect(unitTrigger.textContent ?? '').toContain('Packets');
  });

  it('AUTO-01: switching TO similac-hmf auto-selects packets', async () => {
    mockState.formulaId = 'neocate-infant';
    mockState.unit = 'teaspoons';
    render(FortificationInputs);
    await tick();
    expect(mockState.unit).toBe('teaspoons');

    mockState.formulaId = 'similac-hmf';
    await tick();
    await tick();

    expect(mockState.unit).toBe('packets');
  });

  it('AUTO-02: switching FROM similac-hmf while packets selected resets unit to teaspoons', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationInputs);
    await tick();

    mockState.formulaId = 'neocate-infant';
    await tick();
    await tick();

    expect(mockState.unit).toBe('teaspoons');
  });
});
