import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

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
    reset: vi.fn(() => resetMockState()),
  },
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

    // The schedule should show "Step 1 — Starting dose" text
    expect(screen.getByText(/Step 1 — Starting dose/)).toBeTruthy();
  });

  it('shows empty state placeholder without inputs', () => {
    render(MorphineWeanCalculator);
    expect(
      screen.getByText('Enter values above to generate weaning schedule.')
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
      const summary = document.querySelector('.animate-result-pulse');
      expect(summary).toBeTruthy();
      expect(summary!.getAttribute('aria-live')).toBe('polite');
      expect(summary!.getAttribute('aria-atomic')).toBe('true');
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
          configurable: true,
        });
      }
      const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
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

    it('summary card shows start dose, end dose, and total reduction percentage', () => {
      render(MorphineWeanCalculator);
      expect(screen.getByText('Start')).toBeTruthy();
      expect(screen.getByText('Total reduction')).toBeTruthy();
      // Summary card contains both start and end dose values
      expect(screen.getAllByText('0.1240 mg').length).toBeGreaterThanOrEqual(1);
    });

    it('reduction amounts show percentage alongside mg value', () => {
      render(MorphineWeanCalculator);
      // Every step has a fixed 10.0% reduction relative to the prior dose.
      // Step 2 should show "-0.0124 mg (10.0%)"
      expect(screen.getByText(/-0\.0124 mg \(10\.0%\)/)).toBeTruthy();
    });

    it('reduction amounts do NOT use error/red color class', () => {
      render(MorphineWeanCalculator);
      const container = document.querySelector('[aria-label="Weaning schedule"]');
      expect(container).toBeTruthy();
      // No element should have the error color for reductions
      const errorElements = container!.querySelectorAll('[class*="color-error"]');
      expect(errorElements.length).toBe(0);
    });

    it('step cards have will-change-transform for GPU acceleration', () => {
      render(MorphineWeanCalculator);
      const stepCard = document.querySelector('[data-step-index="0"]');
      expect(stepCard).toBeTruthy();
      expect(stepCard!.className).toContain('will-change-transform');
    });

    it('Step 1 does not have a left accent border', () => {
      render(MorphineWeanCalculator);
      const stepCard = document.querySelector('[data-step-index="0"]');
      expect(stepCard).toBeTruthy();
      expect(stepCard!.className).not.toContain('border-l-');
    });

    it('clear inputs button uses secondary text color, not tertiary', () => {
      render(MorphineWeanCalculator);
      const clearBtn = screen.getByText('Clear inputs');
      expect(clearBtn.className).toContain('text-secondary');
      expect(clearBtn.className).not.toContain('text-tertiary');
    });
  });
});
