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
    expect(screen.getByText('CURRENT GIR')).toBeTruthy();
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

  it('renders titration grid header when result valid', () => {
    render(GirCalculator);
    expect(screen.getByText('If current glucose is…')).toBeTruthy();
  });

  it('valid inputs render non-null Current GIR and Initial rate numbers', () => {
    girState.current.weightKg = 3.1;
    girState.current.dextrosePct = 12.5;
    girState.current.mlPerKgPerDay = 80;
    render(GirCalculator);
    expect(screen.getAllByText('mg/kg/min').length).toBeGreaterThan(0);
  });

  it('selecting a bucket applies aria-checked on the bucket radio', async () => {
    girState.current.weightKg = 3.1;
    girState.current.dextrosePct = 12.5;
    girState.current.mlPerKgPerDay = 80;
    render(GirCalculator);
    const radios = screen.getAllByRole('radio');
    await fireEvent.click(radios[2]);
    // Post-Phase 32-01: summary hero is gone. Selection state lives only on the
    // bucket card itself (border + identity-hero fill, aria-checked=true).
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
    // Δ rate hero remains visible on populated buckets.
    expect(screen.getAllByText(/\((increase|decrease)\)/).length).toBeGreaterThanOrEqual(1);
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
