import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FeedAdvanceCalculator from './FeedAdvanceCalculator.svelte';
import { feedsState } from './state.svelte.js';

// Plan 42.1-05 (D-08): inputs (Weight + mode toggle + per-mode inputs incl.
// totalFluidsMlHr) were extracted into FeedAdvanceInputs.svelte. The calculator
// now renders the result hero + per-mode output region + advisories only.
// Tests that previously interacted with input fields or the mode-toggle moved
// to FeedAdvanceInputs.test.ts; here we cover the hero/output surface.

describe('FeedAdvanceCalculator', () => {
  beforeEach(() => {
    feedsState.reset();
  });

  it('does not render input fields itself (extracted to FeedAdvanceInputs in 42.1-05)', () => {
    render(FeedAdvanceCalculator);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByLabelText('Weight')).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('shows empty-state message when weight is null (bedside default mode)', () => {
    feedsState.current.weightKg = null;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Enter weight to see per-feed volumes/)).toBeTruthy();
  });

  it('shows bedside outputs with default state values when weight entered', () => {
    feedsState.current.weightKg = 1.94;
    render(FeedAdvanceCalculator);
    // Output headings (lowercase identity eyebrows)
    expect(screen.getByText('Trophic')).toBeTruthy();
    expect(screen.getByText('Advance step')).toBeTruthy();
    expect(screen.getByText('Goal')).toBeTruthy();
    // Post-D-07: HeroResult adds a "ml/feed" unit on the GOAL ML/FEED hero
    // above the existing 3-row breakdown (3 + 1 = 4).
    expect(screen.getAllByText('ml/feed').length).toBe(4);
  });

  it('shows ml/kg/d echo next to each output', () => {
    feedsState.current.weightKg = 1.94;
    render(FeedAdvanceCalculator);
    expect(screen.getAllByText(/ml\/kg\/d/).length).toBeGreaterThanOrEqual(3);
  });

  it('shows total fluids rate in ml/hr', () => {
    feedsState.current.weightKg = 1.94;
    render(FeedAdvanceCalculator);
    expect(screen.getAllByText(/ml\/hr/).length).toBeGreaterThanOrEqual(1);
  });

  it('switches to full-nutrition output region when state.mode flips', () => {
    feedsState.current.weightKg = 1.94;
    feedsState.current.mode = 'full-nutrition';
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/TOTAL KCAL\/KG\/DAY/)).toBeTruthy();
  });

  it('full nutrition shows hero value when weight entered', () => {
    feedsState.current.mode = 'full-nutrition';
    feedsState.current.weightKg = 1.74;
    feedsState.current.tpnDex1Pct = 10;
    feedsState.current.tpnMl1Hr = 56;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/TOTAL KCAL\/KG\/DAY/)).toBeTruthy();
    expect(screen.getByText('kcal/kg/d')).toBeTruthy();
  });

  it('full nutrition empty state when weight null', () => {
    feedsState.current.mode = 'full-nutrition';
    feedsState.current.weightKg = null;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Enter weight to see nutrition totals/)).toBeTruthy();
  });

  it('trophic-exceeds-advance advisory renders', () => {
    feedsState.current.weightKg = 1.94;
    feedsState.current.trophicMlKgDay = 35;
    feedsState.current.advanceMlKgDay = 20;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Trophic volume exceeds advance/)).toBeTruthy();
  });

  it('dextrose >12.5% advisory renders in full-nutrition mode', () => {
    feedsState.current.mode = 'full-nutrition';
    feedsState.current.weightKg = 1.74;
    feedsState.current.tpnDex1Pct = 15;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Dextrose >12\.5%/)).toBeTruthy();
  });

  it('weight < 0.5 kg advisory renders', () => {
    feedsState.current.weightKg = 0.4;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Weight below 500 g/)).toBeTruthy();
  });

  it('bedside mode renders IV backfill section when total fluids entered', () => {
    feedsState.current.weightKg = 1.94;
    feedsState.current.totalFluidsMlHr = 12;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Estimated IV rate to meet TFI/)).toBeTruthy();
  });
});
