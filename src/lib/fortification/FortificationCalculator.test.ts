import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';

// Import a $state-backed mock from a .svelte.ts helper so post-render mutations
// actually drive the component's reactivity (Svelte 5 $effect / $derived need
// rune-tracked reads, not plain-object reads). The morphine test pattern uses a
// plain object because it only sets state BEFORE render; the locked Phase 10
// Test 3 requires mutating state AFTER render, which needs a real rune.
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

// SelectPicker associates the visible <span> label to the trigger via
// aria-labelledby, so the trigger's accessible name is exactly the label text.
function getSelectTrigger(label: string): HTMLElement {
  return screen.getByRole('button', { name: label });
}

// Escape to find the hero numeric value specifically inside the hero card
// (which has aria-atomic="true" and aria-live="polite").
function getHeroCard(): HTMLElement {
  const heroLabel = screen.getByText('Amount to Add');
  return heroLabel.closest('section') as HTMLElement;
}

describe('FortificationCalculator', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('UI-01: renders all 5 inputs with correct labels', () => {
    render(FortificationCalculator);
    // NumericInput uses <label for=> → getByLabelText works
    expect(screen.getByLabelText('Starting Volume (mL)')).toBeTruthy();
    // SelectPickers: match the trigger by its aria-label prefix
    expect(getSelectTrigger('Base')).toBeTruthy();
    expect(getSelectTrigger('Formula')).toBeTruthy();
    expect(getSelectTrigger('Target Calorie (kcal/oz)')).toBeTruthy();
    expect(getSelectTrigger('Unit')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('UI-02: renders default outputs (Neocate parity case)', () => {
    render(FortificationCalculator);
    const hero = getHeroCard();
    expect(hero).toBeTruthy();
    // Hero numeric: "2" inside the hero card
    expect(within(hero).getByText(/^\s*2\s*$/)).toBeTruthy();
    // Hero unit label: "Teaspoons" inside the hero card (the Unit select
    // trigger outside also contains the word, so scope to the hero)
    expect(within(hero).getByText('Teaspoons')).toBeTruthy();
    // Verification values
    expect(screen.getByText('183.5 mL')).toBeTruthy();
    expect(screen.getByText('23.5 kcal/oz')).toBeTruthy();
    expect(screen.getByText('180 (6.1 oz)')).toBeTruthy();
  });

  it('UI-02: live recalc when volumeMl mutates after render', async () => {
    render(FortificationCalculator);
    const hero = getHeroCard();
    expect(within(hero).getByText(/^\s*2\s*$/)).toBeTruthy();

    mockState.volumeMl = 360;
    await tick();

    expect(within(hero).getByText(/^\s*4\s*$/)).toBeTruthy();
    expect(screen.getByText('367.0 mL')).toBeTruthy();
    expect(screen.getByText('23.5 kcal/oz')).toBeTruthy();
    expect(screen.getByText('360 (12.2 oz)')).toBeTruthy();
  });

  it('UI-03: isBlocked steady state on mount (no auto-reset)', async () => {
    mockState.formulaId = 'neocate-infant';
    mockState.unit = 'packets';
    render(FortificationCalculator);
    await tick();

    // Blocked message appears (possibly twice — inline and hero body)
    const messages = screen.getAllByText(/Packets is only available for Similac HMF/);
    expect(messages.length).toBeGreaterThanOrEqual(1);

    // No yield/exact/suggested card rendered (verification suppressed)
    expect(screen.queryByText(/\d+\.\d+\s*mL/)).toBeNull();
    expect(screen.queryByText(/\d+\.\d+\s*kcal\/oz/)).toBeNull();

    // Auto-reset must NOT fire on mount — no prior HMF state
    expect(mockState.unit).toBe('packets');
  });

  it('UI-03: selecting Packets while non-HMF enters blocked state (no auto-mutation)', async () => {
    render(FortificationCalculator);
    expect(
      screen.queryByText(/Packets is only available for Similac HMF/)
    ).toBeNull();

    mockState.unit = 'packets';
    await tick();

    expect(
      screen.getAllByText(/Packets is only available for Similac HMF/).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/\d+\.\d+\s*mL/)).toBeNull();
    expect(mockState.unit).toBe('packets');
  });

  it('UI-03: auto-reset on similac-hmf → non-HMF transition while Packets selected', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationCalculator);
    await tick();
    await tick();
    // HMF + packets is valid — not blocked
    expect(
      screen.queryByText(/Packets is only available for Similac HMF/)
    ).toBeNull();

    // Transition to non-HMF — should auto-reset unit to teaspoons
    mockState.formulaId = 'neocate-infant';
    await tick();
    await tick();

    expect(mockState.unit).toBe('teaspoons');
    expect(
      screen.queryByText(/Packets is only available for Similac HMF/)
    ).toBeNull();
    const hero = getHeroCard();
    expect(within(hero).getByText(/^\s*2\s*$/)).toBeTruthy();
    expect(within(hero).getByText('Teaspoons')).toBeTruthy();
  });

  it('UI-04: reuses only NumericInput + SelectPicker (4 select triggers + 1 numeric)', () => {
    render(FortificationCalculator);
    // 4 SelectPicker triggers — they are role="button" with data-select-trigger
    const triggers = document.querySelectorAll('[data-select-trigger]');
    expect(triggers).toHaveLength(4);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('UI-05: uses OKLCH design tokens, not hardcoded colors', () => {
    const { container } = render(FortificationCalculator);
    const html = container.innerHTML;
    expect(html).toContain('var(--color-');
    expect(html).toMatch(/text-\[var\(--color-text-(primary|secondary|tertiary)\)\]/);
  });
});
