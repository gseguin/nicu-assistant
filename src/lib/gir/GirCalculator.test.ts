import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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
});
