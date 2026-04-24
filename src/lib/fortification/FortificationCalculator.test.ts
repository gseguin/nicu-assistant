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

  it('UI-01: does not render input fields itself (extracted to FortificationInputs in 42.1-05)', () => {
    // Plan 42.1-05 (D-08): inputs were extracted into FortificationInputs.svelte so the
    // route can compose them in the desktop sticky right column or the mobile
    // <InputDrawer>. The calculator now renders the hero + verification card only.
    // See FortificationInputs.test.ts for input field coverage.
    render(FortificationCalculator);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByLabelText('Starting Volume')).toBeNull();
    expect(screen.queryByLabelText('Base')).toBeNull();
    expect(screen.queryByLabelText('Formula')).toBeNull();
    expect(screen.queryByLabelText('Target Calorie')).toBeNull();
    expect(screen.queryByLabelText('Unit')).toBeNull();
  });

  it('UI-02: renders default outputs (Neocate parity case)', () => {
    render(FortificationCalculator);
    const hero = getHeroCard();
    expect(hero).toBeTruthy();
    // Hero numeric: "2.0" inside the hero card (D-23: keep one decimal so
    // .num tabular alignment holds — '2.0' not '2').
    expect(within(hero).getByText(/^\s*2\.0\s*$/)).toBeTruthy();
    // Hero unit label: "Teaspoons" inside the hero card. Post-42.1-05 the Unit
    // SelectPicker no longer lives on the calculator (extracted to inputs fragment),
    // so "Teaspoons" only appears once — in the hero unit slot.
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

  // UI-03 packets-availability tests now live in FortificationInputs.test.ts (the
  // Unit SelectPicker was extracted in 42.1-05). The auto-reset / AUTO-01..03
  // behaviors are state-driven (the $effect runs in whichever component owns the
  // state binding). With the inputs extracted, the auto-reset $effect lives in
  // FortificationInputs — covered there.
  //
  // The calculator-level coverage that remains is the hero/verification-only
  // surface: when the state mutates, the hero re-renders the correct unit label
  // ("Teaspoons" / "Packets" / etc.) without owning any input controls.
  it('UI-03 (calculator): hero unit label tracks state.unit reactively', async () => {
    mockState.formulaId = 'similac-hmf';
    mockState.unit = 'packets';
    render(FortificationCalculator);
    await tick();
    const hero = getHeroCard();
    expect(within(hero).getByText('Packets')).toBeTruthy();

    // Switch state away from packets — the hero unit label updates.
    mockState.unit = 'teaspoons';
    await tick();
    expect(within(hero).getByText('Teaspoons')).toBeTruthy();
  });

  it('UI-04: calculator no longer renders inputs (extracted to FortificationInputs)', () => {
    render(FortificationCalculator);
    // Plan 42.1-05 (D-08): no SelectPicker triggers, no NumericInput, no
    // SegmentedToggle inside the calculator. All inputs live in
    // FortificationInputs.svelte (composed by the route).
    const triggers = document.querySelectorAll('[data-select-trigger]');
    expect(triggers).toHaveLength(0);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    const tablists = document.querySelectorAll('[role="tablist"]');
    expect(tablists).toHaveLength(0);
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
