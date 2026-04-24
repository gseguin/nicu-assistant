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
    // Post-shape refactor: Current GIR is now a quiet state line (title case
    // text, rendered uppercase via CSS). Test the DOM text, not the display.
    expect(screen.getByText('Current GIR')).toBeTruthy();
  });

  it('shows current-state line with GIR + running rate, and an empty-titration prompt', () => {
    render(GirCalculator);
    // The state line carries both the GIR mg/kg/min and the running ml/hr.
    // Each unit/qualifier is its own text node so screen readers and tests can
    // locate them independently.
    expect(screen.getByText('Current GIR')).toBeTruthy();
    expect(screen.getByText('mg/kg/min')).toBeTruthy();
    expect(screen.getByText('running')).toBeTruthy();
    expect(screen.getAllByText('ml/hr').length).toBeGreaterThan(0);
    // With no bucket selected, the hero is the titration prompt.
    expect(screen.getByText('TITRATION')).toBeTruthy();
    expect(
      screen.getByText('Select a glucose range below to see the adjustment.')
    ).toBeTruthy();
  });

  it('shows empty-state hero when any input null', () => {
    girState.current.weightKg = null;
    girState.current.dextrosePct = null;
    girState.current.mlPerKgPerDay = null;
    render(GirCalculator);
    expect(screen.getByText(/Enter weight, dextrose, and fluid rate to see GIR\./)).toBeTruthy();
  });

  it('does NOT render the dextrose-input advisory itself (extracted to GirInputs in 42.1-05)', () => {
    // Plan 42.1-05 (D-08): the Dextrose >12.5% advisory is co-located with the
    // Dextrose NumericInput (which now lives in GirInputs.svelte). The calculator
    // owns only result-derived advisories (GIR>12, GIR<4). Coverage moved to
    // GirInputs.test.ts.
    girState.current.dextrosePct = 15;
    render(GirCalculator);
    expect(screen.queryByText(/Dextrose >12\.5% requires central venous access/)).toBeNull();
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
