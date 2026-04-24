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
    reset: vi.fn(() => resetMockState())
  }
}));

import FortificationCalculator from './FortificationCalculator.svelte';

// Helpers ---------------------------------------------------------------

// SelectPicker associates the visible <span> label to the trigger via
// aria-labelledby, so the trigger's accessible name is exactly the label text.
function getSelectTrigger(label: string): HTMLElement {
  return screen.getByLabelText(label);
}

// Escape to find the hero numeric value specifically inside the hero card
// (which has aria-atomic="true" and aria-live="polite").
// Post-D-07: HeroResult uses UPPERCASE eyebrow string ("AMOUNT TO ADD").
function getHeroCard(): HTMLElement {
  const heroLabel = screen.getByText('AMOUNT TO ADD');
  return heroLabel.closest('section') as HTMLElement;
}

describe('FortificationCalculator', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('UI-01: renders all 5 inputs with correct labels', () => {
    render(FortificationCalculator);
    // NumericInput uses <label for=> → getByLabelText works
    expect(screen.getByLabelText('Starting Volume')).toBeTruthy();
    // SelectPickers: match the trigger by its aria-label prefix
    expect(getSelectTrigger('Base')).toBeTruthy();
    expect(getSelectTrigger('Formula')).toBeTruthy();
    expect(getSelectTrigger('Target Calorie')).toBeTruthy();
    expect(getSelectTrigger('Unit')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('UI-02: renders default outputs (Neocate parity case)', () => {
    render(FortificationCalculator);
    const hero = getHeroCard();
    expect(hero).toBeTruthy();
    // Hero numeric: "2.0" inside the hero card (D-23: keep one decimal so
    // .num tabular alignment holds — '2.0' not '2').
    expect(within(hero).getByText(/^\s*2\.0\s*$/)).toBeTruthy();
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
    expect(within(hero).getByText(/^\s*2\.0\s*$/)).toBeTruthy();

    mockState.volumeMl = 360;
    await tick();

    expect(within(hero).getByText(/^\s*4\.0\s*$/)).toBeTruthy();
    expect(screen.getByText('367.0 mL')).toBeTruthy();
    expect(screen.getByText('23.5 kcal/oz')).toBeTruthy();
    expect(screen.getByText('360 (12.2 oz)')).toBeTruthy();
  });

  it('UI-03: Packets option is hidden from the Unit picker when formula is not Similac HMF', async () => {
    mockState.formulaId = 'neocate-infant';
    render(FortificationCalculator);
    await tick();

    // The Unit picker trigger displays the currently-selected option label.
    // Packets must not appear as the trigger value or in any select item for non-HMF.
    const unitTrigger = screen.getByLabelText('Unit');
    expect(unitTrigger.textContent ?? '').not.toContain('Packets');

    // Defensive: scan the entire DOM. The only place "Packets" should appear
    // for a non-HMF formula is in the source code (via grep), not in any
    // rendered text node.
    expect(screen.queryByText(/^Packets$/)).toBeNull();
  });

  it('UI-03: Packets option is available in the Unit picker when formula is Similac HMF', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationCalculator);
    await tick();

    // With formula = Similac HMF and unit = packets, the Unit picker trigger
    // should show "Packets" as the selected value.
    const unitTrigger = screen.getByLabelText('Unit');
    expect(unitTrigger.textContent ?? '').toContain('Packets');
  });

  it('UI-03: auto-reset on similac-hmf → non-HMF transition while Packets selected', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationCalculator);
    await tick();
    await tick();
    // HMF + packets is valid — not blocked
    expect(screen.queryByText(/Packets is only available for Similac HMF/)).toBeNull();

    // Transition to non-HMF — should auto-reset unit to teaspoons
    mockState.formulaId = 'neocate-infant';
    await tick();
    await tick();

    expect(mockState.unit).toBe('teaspoons');
    expect(screen.queryByText(/Packets is only available for Similac HMF/)).toBeNull();
    const hero = getHeroCard();
    expect(within(hero).getByText(/^\s*2\.0\s*$/)).toBeTruthy();
    expect(within(hero).getByText('Teaspoons')).toBeTruthy();
  });

  it('AUTO-01: switching TO similac-hmf auto-selects packets', async () => {
    mockState.formulaId = 'neocate-infant';
    mockState.unit = 'teaspoons';
    render(FortificationCalculator);
    await tick();
    expect(mockState.unit).toBe('teaspoons');

    mockState.formulaId = 'similac-hmf';
    await tick();
    await tick();

    expect(mockState.unit).toBe('packets');
  });

  it('AUTO-02: switching FROM similac-hmf while packets selected resets unit (regression)', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationCalculator);
    await tick();

    mockState.formulaId = 'neocate-infant';
    await tick();
    await tick();

    expect(mockState.unit).toBe('teaspoons');
  });

  it('AUTO-03: initial mount with persisted similac-hmf does NOT clobber saved unit', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'grams';
    render(FortificationCalculator);
    await tick();
    await tick();

    expect(mockState.unit).toBe('grams');
  });

  it('UI-04: reuses NumericInput + SelectPicker + SegmentedToggle (3 select triggers + 1 numeric + 1 toggle)', () => {
    render(FortificationCalculator);
    // 3 SelectPicker triggers remaining (Formula, kcal, Unit) — Base is now a SegmentedToggle
    const triggers = document.querySelectorAll('[data-select-trigger]');
    expect(triggers).toHaveLength(3);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    // Base SegmentedToggle renders a tablist with 2 tabs
    const tablists = document.querySelectorAll('[role="tablist"]');
    expect(tablists).toHaveLength(1);
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  describe('Phase 23-01: result feedback', () => {
    it('hero retains aria-live="polite" and aria-atomic="true"', () => {
      render(FortificationCalculator);
      const hero = getHeroCard();
      expect(hero.getAttribute('aria-live')).toBe('polite');
      expect(hero.getAttribute('aria-atomic')).toBe('true');
    });

    it('hero <section> carries .animate-result-pulse class when result present', () => {
      render(FortificationCalculator);
      const hero = getHeroCard();
      // Post-D-07: HeroResult owns animate-result-pulse on the outer <section>.
      expect(hero.classList.contains('animate-result-pulse')).toBe(true);
    });

    it('hero inner block re-mounts when result changes ({#key pulseKey})', async () => {
      render(FortificationCalculator);
      const before = screen.getByText(/^\s*2\.0\s*$/);
      mockState.volumeMl = 360;
      await tick();
      const after = screen.getByText(/^\s*4\.0\s*$/);
      // Different DOM nodes — HeroResult's {#key pulseKey} re-mounted the inner block.
      expect(after).not.toBe(before);
    });

    it('does not call scrollIntoView or steal focus on result update', async () => {
      if (!('scrollIntoView' in HTMLElement.prototype)) {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
          value: () => {},
          writable: true,
          configurable: true
        });
      }
      const scrollSpy = vi
        .spyOn(HTMLElement.prototype, 'scrollIntoView')
        .mockImplementation(() => {});
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      render(FortificationCalculator);
      const activeBefore = document.activeElement;
      mockState.volumeMl = 360;
      await tick();
      expect(scrollSpy).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(activeBefore);
      scrollSpy.mockRestore();
      focusSpy.mockRestore();
    });
  });

  it('UI-05: uses OKLCH design tokens, not hardcoded colors', () => {
    const { container } = render(FortificationCalculator);
    const html = container.innerHTML;
    expect(html).toContain('var(--color-');
    expect(html).toMatch(/text-\[var\(--color-text-(primary|secondary|tertiary)\)\]/);
  });
});
