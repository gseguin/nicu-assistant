import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

// Mock morphineState before importing the component.
// The real module uses Svelte 5 $state runes which are difficult to control
// in test environments. We provide a plain reactive-like object instead.
const mockState = {
  activeMode: 'linear' as 'linear' | 'compounding',
  weightKg: null as number | null,
  maxDoseMgKgDose: null as number | null,
  decreasePct: null as number | null,
};

vi.mock('$lib/morphine/state.svelte.js', () => ({
  morphineState: {
    get current() {
      return mockState;
    },
    init: vi.fn(),
    persist: vi.fn(),
    reset: vi.fn(() => {
      mockState.activeMode = 'linear';
      mockState.weightKg = null;
      mockState.maxDoseMgKgDose = null;
      mockState.decreasePct = null;
    }),
  },
}));

import MorphineWeanCalculator from './MorphineWeanCalculator.svelte';

describe('MorphineWeanCalculator', () => {
  beforeEach(() => {
    // Reset mock state to defaults before each test
    mockState.activeMode = 'linear';
    mockState.weightKg = null;
    mockState.maxDoseMgKgDose = null;
    mockState.decreasePct = null;
  });

  it('renders mode tabs with correct roles and default active mode', () => {
    render(MorphineWeanCalculator);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent('Linear');
    expect(tabs[1]).toHaveTextContent('Compounding');
    // Linear is the default active mode
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches active mode when clicking Compounding tab', async () => {
    render(MorphineWeanCalculator);
    const tabs = screen.getAllByRole('tab');
    const compoundingTab = tabs[1];

    await fireEvent.click(compoundingTab);

    // After click, mockState.activeMode is set by the component's activateMode function
    // which sets morphineState.current.activeMode = mode (writes to our mockState)
    expect(mockState.activeMode).toBe('compounding');
  });

  it('renders three input fields with correct labels', () => {
    render(MorphineWeanCalculator);
    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons).toHaveLength(3);

    expect(screen.getByLabelText('Dosing weight')).toBeTruthy();
    expect(screen.getByLabelText('Max morphine dose')).toBeTruthy();
    expect(screen.getByLabelText('Decrease per step')).toBeTruthy();
  });

  it('shows schedule with valid inputs', () => {
    // Set state with valid inputs before rendering
    mockState.weightKg = 3.1;
    mockState.maxDoseMgKgDose = 0.04;
    mockState.decreasePct = 10;

    render(MorphineWeanCalculator);

    // The schedule should show "Step 1" text
    expect(screen.getByText('Step 1')).toBeTruthy();
  });

  it('shows empty state placeholder without inputs', () => {
    render(MorphineWeanCalculator);
    expect(
      screen.getByText('Enter values above to generate weaning schedule.')
    ).toBeTruthy();
  });

  it('tablist has correct ARIA label', () => {
    render(MorphineWeanCalculator);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Weaning mode');
  });
});
