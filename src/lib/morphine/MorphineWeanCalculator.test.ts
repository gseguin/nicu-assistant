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

    // The schedule should show "Step 1 — Starting dose" text
    expect(screen.getByText(/Step 1 — Starting dose/)).toBeTruthy();
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
      // Linear mode: every step has 10.0% reduction
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
