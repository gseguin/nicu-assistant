// src/lib/feeds/FeedAdvanceInputs.test.ts
// Co-located component test for the inputs fragment extracted in Plan 42.1-05 (D-08).
// Mirrors the input-field + mode-toggle assertions that previously lived in
// FeedAdvanceCalculator.test.ts.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FeedAdvanceInputs from './FeedAdvanceInputs.svelte';
import { feedsState } from './state.svelte.js';

describe('FeedAdvanceInputs', () => {
  beforeEach(() => {
    feedsState.reset();
  });

  it('renders the Weight input + mode toggle in the shared card', () => {
    render(FeedAdvanceInputs);
    expect(screen.getByLabelText('Weight')).toBeTruthy();
    // SegmentedToggle uses role="tablist" with two role="tab" tabs
    expect(screen.getByRole('tab', { name: /Bedside Advancement/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Full Nutrition/i })).toBeTruthy();
  });

  it('bedside mode renders trophic / advance / goal / total fluids inputs', () => {
    feedsState.current.mode = 'bedside';
    render(FeedAdvanceInputs);
    expect(screen.getByLabelText('Trophic')).toBeTruthy();
    expect(screen.getByLabelText('Advance')).toBeTruthy();
    expect(screen.getByLabelText('Goal')).toBeTruthy();
    expect(screen.getByLabelText('Total fluids (for IV backfill)')).toBeTruthy();
  });

  it('full-nutrition mode renders TPN line / SMOF / enteral inputs', () => {
    feedsState.current.mode = 'full-nutrition';
    render(FeedAdvanceInputs);
    // Each line has its own Dextrose + Rate fields; the labels repeat across the two lines.
    expect(screen.getAllByLabelText('Dextrose').length).toBe(2);
    expect(screen.getAllByLabelText('Rate').length).toBe(2);
    expect(screen.getByLabelText('SMOF 20% lipid')).toBeTruthy();
    expect(screen.getByLabelText('Enteral volume')).toBeTruthy();
  });

  it('clicking the Full Nutrition tab updates feedsState.current.mode', async () => {
    feedsState.current.weightKg = 2.5;
    render(FeedAdvanceInputs);
    const fullNutritionTab = screen.getByRole('tab', { name: /Full Nutrition/i });
    await fireEvent.click(fullNutritionTab);
    expect(feedsState.current.mode).toBe('full-nutrition');
    // Weight is preserved across the toggle (single source of truth)
    expect(feedsState.current.weightKg).toBe(2.5);
  });
});
