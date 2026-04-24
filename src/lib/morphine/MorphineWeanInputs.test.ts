// src/lib/morphine/MorphineWeanInputs.test.ts
// Co-located component test for the inputs fragment extracted in Plan 42.1-05 (D-08).
// Mirrors the input field + clear button assertions that previously lived in
// MorphineWeanCalculator.test.ts.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

import { mockState, resetMockState } from './test-mock-state.svelte.js';

vi.mock('$lib/morphine/state.svelte.js', () => ({
  morphineState: {
    get current() {
      return mockState;
    },
    init: vi.fn(),
    persist: vi.fn(),
    reset: vi.fn(() => resetMockState())
  }
}));

import MorphineWeanInputs from './MorphineWeanInputs.svelte';

describe('MorphineWeanInputs', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('renders three input fields with correct labels', () => {
    render(MorphineWeanInputs);
    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons).toHaveLength(3);

    expect(screen.getByLabelText('Dosing weight')).toBeTruthy();
    expect(screen.getByLabelText('Max morphine dose')).toBeTruthy();
    expect(screen.getByLabelText('Decrease per step')).toBeTruthy();
  });

  it('shows clear inputs button when at least one value is set', () => {
    mockState.weightKg = 3.1;
    render(MorphineWeanInputs);
    const clearBtn = screen.getByText('Clear inputs');
    expect(clearBtn).toBeTruthy();
    expect(clearBtn.className).toContain('text-secondary');
    expect(clearBtn.className).not.toContain('text-tertiary');
  });

  it('clicking clear inputs invokes morphineState.reset()', async () => {
    mockState.weightKg = 7.5;
    mockState.maxDoseMgKgDose = 0.08;
    mockState.decreasePct = 20;
    render(MorphineWeanInputs);
    await fireEvent.click(screen.getByText('Clear inputs'));
    // The mock's reset() clears to nulls (mirrors the production reset shape; production
    // re-seeds to config defaults — covered by morphine-state.test.ts).
    expect(mockState.weightKg).toBeNull();
    expect(mockState.maxDoseMgKgDose).toBeNull();
    expect(mockState.decreasePct).toBeNull();
  });
});
