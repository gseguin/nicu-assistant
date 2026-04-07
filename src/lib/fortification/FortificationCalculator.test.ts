// LOCKED REFERENCE VALUES — Neocate Infant + BM + 180 mL + 24 kcal/oz
// (computed by calling calculateFortification directly via a scratch test in Task 2)
//   grams       → amountToAdd 5.713238287266382, yieldMl 183.99926680108646, exact 24.000000000000004
//   teaspoons   → amountToAdd 2,                yieldMl 183.5,               exact 23.510166212534063  (BM+Tsp+24 shortcut)
//   tablespoons → amountToAdd 0.7617651049688509, yieldMl 183.99926680108646, exact 24.000000000000004
//   scoops      → amountToAdd 1.2420083233187789, yieldMl 183.99926680108646, exact 24.000000000000004
//   packets     → 0 (Neocate is non-HMF; row HIDDEN in UI)
//
// Verification card uses the GRAMS BRANCH:
//   yield: 184.0 mL, exact: 24.0 kcal/oz
//
// LOCKED REFERENCE VALUES — Neocate Infant + BM + 360 mL + 24 kcal/oz
//   grams       → amountToAdd 11.426476574532764, yieldMl 367.9985336021729, exact 24.000000000000004
//   teaspoons   → amountToAdd 4,                  yieldMl 367,               exact 23.510166212534063
//   tablespoons → amountToAdd 1.5235302099377017, yieldMl 367.9985336021729, exact 24.000000000000004
//   scoops      → amountToAdd 2.4840166466375577, yieldMl 367.9985336021729, exact 24.000000000000004
//   packets     → 0 (hidden)
//
// Verification card uses the GRAMS BRANCH:
//   yield: 368.0 mL, exact: 24.0 kcal/oz

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';

// Import a $state-backed mock from a .svelte.ts helper so post-render mutations
// actually drive the component's reactivity (Svelte 5 $effect / $derived need
// rune-tracked reads, not plain-object reads).
import { mockState, resetMockState } from './test-mock-state.svelte.js';

vi.mock('$lib/fortification/state.svelte.js', () => ({
  fortificationState: {
    get current() {
      return mockState;
    },
    init: vi.fn(),
    persist: vi.fn(),
    reset: vi.fn(() => resetMockState()),
  },
}));

import FortificationCalculator from './FortificationCalculator.svelte';

// Helpers ---------------------------------------------------------------

function getSelectTrigger(label: string): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^${label}:`) });
}

function getUnitRow(unit: string): HTMLElement | null {
  return document.querySelector(`[data-unit-row="${unit}"]`);
}

describe('FortificationCalculator', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('REFACTOR-01: renders 4 inputs (Base, Volume, Formula, Target Calorie) — no Unit picker', () => {
    render(FortificationCalculator);
    expect(screen.getByLabelText('Starting Volume (mL)')).toBeTruthy();
    expect(getSelectTrigger('Base')).toBeTruthy();
    expect(getSelectTrigger('Formula')).toBeTruthy();
    expect(getSelectTrigger('Target Calorie \\(kcal/oz\\)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Unit:/ })).toBeNull();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('REFACTOR-02/03: default Neocate render shows 4 unit rows + grams-branch verification, no packets row', () => {
    render(FortificationCalculator);

    const gramsRow = getUnitRow('grams');
    const tspRow = getUnitRow('teaspoons');
    const tbspRow = getUnitRow('tablespoons');
    const scoopsRow = getUnitRow('scoops');
    expect(gramsRow).not.toBeNull();
    expect(tspRow).not.toBeNull();
    expect(tbspRow).not.toBeNull();
    expect(scoopsRow).not.toBeNull();
    expect(getUnitRow('packets')).toBeNull();

    // Locked amount values (formatAmount: toFixed(2) then strip trailing zeros).
    expect(within(gramsRow!).getByText('5.71')).toBeTruthy();
    expect(within(tspRow!).getByText('2')).toBeTruthy();
    expect(within(tbspRow!).getByText('0.76')).toBeTruthy();
    expect(within(scoopsRow!).getByText('1.24')).toBeTruthy();

    // Verification card: grams branch.
    expect(screen.getByText('184.0 mL')).toBeTruthy();
    expect(screen.getByText('24.0 kcal/oz')).toBeTruthy();

    // Suggested Starting Volume must NOT be in the document.
    expect(screen.queryByText(/Suggested/i)).toBeNull();
  });

  it('REFACTOR-02: live recalc updates all unit rows and verification card on volume change', async () => {
    render(FortificationCalculator);

    // Sanity: defaults.
    expect(within(getUnitRow('grams')!).getByText('5.71')).toBeTruthy();

    mockState.volumeMl = 360;
    await tick();

    // Locked values for volume=360.
    expect(within(getUnitRow('grams')!).getByText('11.43')).toBeTruthy();
    expect(within(getUnitRow('teaspoons')!).getByText('4')).toBeTruthy();
    expect(within(getUnitRow('tablespoons')!).getByText('1.52')).toBeTruthy();
    expect(within(getUnitRow('scoops')!).getByText('2.48')).toBeTruthy();
    expect(getUnitRow('packets')).toBeNull();

    // Verification card: grams branch at 360 mL.
    expect(screen.getByText('368.0 mL')).toBeTruthy();
    expect(screen.getByText('24.0 kcal/oz')).toBeTruthy();
  });

  it('REFACTOR-02: packets row only renders when formula = similac-hmf', async () => {
    render(FortificationCalculator);
    expect(getUnitRow('packets')).toBeNull();

    mockState.formulaId = 'similac-hmf';
    await tick();
    expect(getUnitRow('packets')).not.toBeNull();

    mockState.formulaId = 'neocate-infant';
    await tick();
    expect(getUnitRow('packets')).toBeNull();
  });

  it('REFACTOR-01: 3 SelectPicker triggers + 1 NumericInput remain', () => {
    render(FortificationCalculator);
    const triggers = document.querySelectorAll('[data-select-trigger]');
    expect(triggers).toHaveLength(3);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('UI-05: uses OKLCH design tokens, not hardcoded colors', () => {
    const { container } = render(FortificationCalculator);
    const html = container.innerHTML;
    expect(html).toContain('var(--color-');
    expect(html).toMatch(/text-\[var\(--color-text-(primary|secondary|tertiary)\)\]/);
  });
});
