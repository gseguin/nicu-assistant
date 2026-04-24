import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

// Import a $state-backed mock from a .svelte.ts helper so bind:value bindings
// see reactive properties and don't trigger binding_property_non_reactive warnings.
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

import MorphineWeanCalculator from './MorphineWeanCalculator.svelte';

describe('MorphineWeanCalculator', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('does not render a weaning mode toggle', () => {
    render(MorphineWeanCalculator);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('does not render input fields itself (extracted to MorphineWeanInputs in 42.1-05)', () => {
    // Plan 42.1-05 (D-08): inputs were extracted into MorphineWeanInputs.svelte so the
    // route can compose them in the desktop sticky right column or the mobile
    // <InputDrawer>. The calculator now renders the hero + schedule only.
    // See MorphineWeanInputs.test.ts for input field coverage.
    render(MorphineWeanCalculator);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByLabelText('Dosing weight')).toBeNull();
  });

  it('shows schedule with valid inputs', () => {
    // Set state with valid inputs before rendering
    mockState.weightKg = 3.1;
    mockState.maxDoseMgKgDose = 0.04;
    mockState.decreasePct = 10;

    render(MorphineWeanCalculator);

    // The schedule should show "Step 1: Starting dose" text
    expect(screen.getByText(/Step 1: Starting dose/)).toBeTruthy();
  });

  it('shows empty state placeholder without inputs', () => {
    render(MorphineWeanCalculator);
    // Copy updated in 42.1-05: dropped "above" since on mobile the inputs now live in a
    // sticky drawer below the schedule, not above it.
    expect(
      screen.getByText('Enter weight, max dose, and step to see the weaning schedule.')
    ).toBeTruthy();
  });

  describe('Phase 23-01: result feedback', () => {
    beforeEach(() => {
      mockState.weightKg = 3.1;
      mockState.maxDoseMgKgDose = 0.04;
      mockState.decreasePct = 10;
    });

    it('summary card has aria-live="polite" and aria-atomic="true"', () => {
      render(MorphineWeanCalculator);
      // Post-polish refactor: the pulse class lives on an inner wrapper; the
      // live-region attributes stay on the outer <section>. Locate the
      // summary via its data-testid and walk up to the wrapping <section>.
      const summaryBody = document.querySelector('[data-testid="morphine-summary"]');
      expect(summaryBody).toBeTruthy();
      const section = summaryBody!.closest('section');
      expect(section).toBeTruthy();
      expect(section!.getAttribute('aria-live')).toBe('polite');
      expect(section!.getAttribute('aria-atomic')).toBe('true');
    });

    it('hero is now a HeroResult consumer (single HeroResult <section> + inner .animate-result-pulse)', () => {
      const { container } = render(MorphineWeanCalculator);
      // Post-polish refactor: pulse class moved from the outer <section> to an
      // inner wrapper for DOM-identity preservation. The HeroResult <section>
      // is identifiable by carrying an inner .animate-result-pulse wrapper.
      const pulseWrappers = container.querySelectorAll('section .animate-result-pulse');
      expect(pulseWrappers.length).toBe(1);
      const section = pulseWrappers[0].closest('section');
      expect(section!.getAttribute('aria-live')).toBe('polite');
    });

    it('summary card uses shared .animate-result-pulse class (old class removed)', () => {
      render(MorphineWeanCalculator);
      expect(document.querySelector('.animate-result-pulse')).toBeTruthy();
      expect(document.querySelector('.animate-summary-pulse')).toBeNull();
    });

    it('does not call scrollIntoView or steal focus on render', () => {
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
      const activeBefore = document.activeElement;
      render(MorphineWeanCalculator);
      expect(scrollSpy).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(activeBefore);
      scrollSpy.mockRestore();
      focusSpy.mockRestore();
    });
  });

  describe('v1.2 polish fixes', () => {
    beforeEach(() => {
      mockState.weightKg = 3.1;
      mockState.maxDoseMgKgDose = 0.04;
      mockState.decreasePct = 10;
    });

    it('summary card promotes total-reduction percentage as the display numeral (post-42.1 contract)', () => {
      // Post-42.1 critique follow-up: the summary HeroResult was redesigned so the
      // "Total reduction" percentage is the single text-display numeral. Start and
      // Step N doses live on a subordinate secondary line. See DESIGN.md
      // "The Hero Result (signature pattern)" + HeroResult display-numeral contract.
      render(MorphineWeanCalculator);
      const summary = screen.getByTestId('morphine-summary');
      expect(summary).toBeTruthy();
      // Display numeral renders the total-reduction percentage (90% for the
      // default 3.1 / 0.04 / 10 case). formatPercent rounds to 2 decimals.
      const displayNumeral = summary.querySelector('.text-display');
      expect(displayNumeral).toBeTruthy();
      expect(displayNumeral!.textContent).toMatch(/%/);
      // "Total reduction" label sits beside the numeral in ui weight.
      expect(screen.getByText('Total reduction')).toBeTruthy();
      // Secondary line carries the Start/Step N doses readable in one phrase.
      expect(summary.textContent).toContain('0.124');
      expect(summary.textContent).toContain('Step');
    });

    it('reduction amounts show percentage alongside mg value', () => {
      render(MorphineWeanCalculator);
      // Every step has a fixed 10% reduction relative to the prior dose.
      // Step 2 should show "-0.012 mg (10.00%)" via formatMg + formatPercent.
      expect(screen.getByText(/-0\.012 mg \(10\.00%\)/)).toBeTruthy();
    });

    it('reduction amounts do NOT use error/red color class', () => {
      render(MorphineWeanCalculator);
      const container = document.querySelector('[aria-label="Weaning schedule"]');
      expect(container).toBeTruthy();
      // No element should have the error color for reductions
      const errorElements = container!.querySelectorAll('[class*="color-error"]');
      expect(errorElements.length).toBe(0);
    });

    it('clicking a schedule row sets aria-current="step" only on that row (D-16)', async () => {
      render(MorphineWeanCalculator);
      const rowZero = document.querySelector('[data-step-index="0"]') as HTMLElement;
      const rowTwo = document.querySelector('[data-step-index="2"]') as HTMLElement;
      expect(rowZero).toBeTruthy();
      expect(rowTwo).toBeTruthy();

      // Initially no row is current.
      expect(rowZero.getAttribute('aria-current')).toBeNull();
      expect(rowTwo.getAttribute('aria-current')).toBeNull();

      // Click row 2 — it becomes the current step.
      await fireEvent.click(rowTwo);
      expect(rowTwo.getAttribute('aria-current')).toBe('step');
      expect(rowZero.getAttribute('aria-current')).toBeNull();

      // The active row gains the inset identity ring.
      expect(rowTwo.className).toContain('ring-1');
      expect(rowTwo.className).toContain('ring-inset');
      expect(rowTwo.className).toContain('ring-[var(--color-identity)]');
      expect(rowZero.className).not.toContain('ring-1');
    });

    it('Step 1 does not have a left accent border', () => {
      render(MorphineWeanCalculator);
      const stepCard = document.querySelector('[data-step-index="0"]');
      expect(stepCard).toBeTruthy();
      expect(stepCard!.className).not.toContain('border-l-');
    });

    it('clear inputs button no longer lives on the calculator (moved to MorphineWeanInputs)', () => {
      // Plan 42.1-05 (D-08): the Clear inputs button moved with the inputs into
      // MorphineWeanInputs.svelte. See MorphineWeanInputs.test.ts for coverage.
      render(MorphineWeanCalculator);
      expect(screen.queryByText('Clear inputs')).toBeNull();
    });
  });
});
