import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FeedAdvanceCalculator from './FeedAdvanceCalculator.svelte';
import { feedsState } from './state.svelte.js';

describe('FeedAdvanceCalculator', () => {
  beforeEach(() => {
    feedsState.reset();
  });

  it('renders without crashing', () => {
    render(FeedAdvanceCalculator);
    expect(screen.getByText('Weight')).toBeTruthy();
  });

  it('shows empty-state message when weight is null', () => {
    feedsState.current.weightKg = null;
    render(FeedAdvanceCalculator);
    expect(screen.getByText(/Enter a weight to see per-feed volumes/)).toBeTruthy();
  });

  it('shows bedside outputs with default state values when weight entered', () => {
    feedsState.current.weightKg = 1.94;
    render(FeedAdvanceCalculator);
    // "Trophic" appears as both input label and output heading
    expect(screen.getAllByText('Trophic').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Advance step')).toBeTruthy();
    // "Goal" appears as both input label and output heading
    expect(screen.getAllByText('Goal').length).toBeGreaterThanOrEqual(1);
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

  it('mode toggle switches to full nutrition', async () => {
    feedsState.current.weightKg = 1.94;
    render(FeedAdvanceCalculator);
    const fullNutritionTab = screen.getByRole('tab', { name: /Full Nutrition/i });
    await fireEvent.click(fullNutritionTab);
    expect(screen.getByText(/TOTAL KCAL\/KG\/DAY/)).toBeTruthy();
  });

  it('mode toggle preserves weight', async () => {
    feedsState.current.weightKg = 2.5;
    render(FeedAdvanceCalculator);
    const fullNutritionTab = screen.getByRole('tab', { name: /Full Nutrition/i });
    await fireEvent.click(fullNutritionTab);
    // Weight is still set -- full nutrition results should render
    expect(feedsState.current.weightKg).toBe(2.5);
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
    expect(screen.getByText(/Enter a weight to see nutrition totals/)).toBeTruthy();
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
