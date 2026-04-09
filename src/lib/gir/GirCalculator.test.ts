import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GirCalculator from './GirCalculator.svelte';
import { girState } from './state.svelte.js';

describe('GirCalculator', () => {
  beforeEach(() => {
    girState.reset();
  });

  it('renders without crashing', () => {
    render(GirCalculator);
    expect(screen.getByText('Starting GIR by population')).toBeTruthy();
  });

  it('shows Current GIR hero with default state values', () => {
    render(GirCalculator);
    expect(screen.getByText('CURRENT GIR')).toBeTruthy();
    expect(screen.getByText('INITIAL RATE')).toBeTruthy();
  });

  it('shows empty-state hero when any input null', () => {
    girState.current.weightKg = null;
    girState.current.dextrosePct = null;
    girState.current.mlPerKgPerDay = null;
    render(GirCalculator);
    expect(screen.getByText(/Enter weight, dextrose %, and fluid rate/)).toBeTruthy();
  });

  it('surfaces amber Dextrose >12.5% advisory', () => {
    girState.current.dextrosePct = 15;
    render(GirCalculator);
    expect(screen.getByText(/Dextrose >12\.5% requires central venous access/)).toBeTruthy();
  });

  it('renders population reference card with all three rows', () => {
    render(GirCalculator);
    expect(screen.getByText('IDM / LGA')).toBeTruthy();
    expect(screen.getByText('IUGR')).toBeTruthy();
    expect(screen.getByText('Preterm or NPO')).toBeTruthy();
    expect(screen.getByText(/3–5/)).toBeTruthy();
  });

  it('renders titration grid header when result valid', () => {
    render(GirCalculator);
    expect(screen.getByText('If current glucose is…')).toBeTruthy();
  });

  it('shows target-guidance empty state until bucket selected', () => {
    render(GirCalculator);
    expect(screen.getByText('Select a glucose range to see target rate')).toBeTruthy();
  });

  it('valid inputs render non-null Current GIR and Initial rate numbers', () => {
    girState.current.weightKg = 3.1;
    girState.current.dextrosePct = 12.5;
    girState.current.mlPerKgPerDay = 80;
    render(GirCalculator);
    expect(screen.getAllByText('mg/kg/min').length).toBeGreaterThan(0);
  });

  it('selecting a bucket updates target-guidance hero with Δ rate as the action', async () => {
    girState.current.weightKg = 3.1;
    girState.current.dextrosePct = 12.5;
    girState.current.mlPerKgPerDay = 80;
    render(GirCalculator);
    const radios = screen.getAllByRole('radio');
    await fireEvent.click(radios[2]); // 40-50 bucket (first-rendered layout)
    // Post-Phase 30-01: summary hero eyebrow is ADJUST RATE / HYPERGLYCEMIA / TARGET REACHED
    // and the big number is Δ rate (ml/hr), not GIR (mg/kg/min).
    expect(screen.getByText('ADJUST RATE')).toBeTruthy();
    // Direction word appears in the bucket cards AND the summary hero — at least 2 matches.
    expect(screen.getAllByText(/\((increase|decrease)\)/).length).toBeGreaterThanOrEqual(2);
  });

  it('GIR >12 advisory surfaces when computed GIR is high', () => {
    girState.current.weightKg = 1;
    girState.current.dextrosePct = 20;
    girState.current.mlPerKgPerDay = 150;
    render(GirCalculator);
    expect(screen.getByText(/GIR >12.*hyperinsulinism/)).toBeTruthy();
  });

  it('GIR <4 advisory surfaces when computed GIR is low', () => {
    girState.current.weightKg = 3.1;
    girState.current.dextrosePct = 5;
    girState.current.mlPerKgPerDay = 40;
    render(GirCalculator);
    expect(screen.getByText(/Below basal glucose utilization/)).toBeTruthy();
  });
});
