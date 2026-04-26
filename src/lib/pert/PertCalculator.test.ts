// Component output-surface tests for PertCalculator.svelte (Phase 3 CONTEXT D-07).
// Mirrors src/lib/feeds/FeedAdvanceCalculator.test.ts pattern: pertState.reset()
// in beforeEach, render(), assert via screen queries.
//
// Em-dash ban (Phase 3 Q1): this file contains zero U+2014 / U+2013 characters.
// All separators are ASCII period or colon.
//
// Scope: this file asserts the rendered surface only. Math correctness is the
// responsibility of Plan 03-02 calc-layer parity tests.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PertCalculator from './PertCalculator.svelte';
import { pertState } from './state.svelte.js';

describe('PertCalculator output surface', () => {
  beforeEach(() => {
    pertState.reset();
  });

  it('does not render input fields itself (extracted to PertInputs per D-07)', () => {
    render(PertCalculator);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('shows Oral empty-state hero copy when fatGrams is null', () => {
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = null;
    render(PertCalculator);
    expect(screen.getByText(/Enter weight and fat grams/)).toBeTruthy();
  });

  it('shows Tube-Feed empty-state hero copy when formulaId is null', () => {
    pertState.current.mode = 'tube-feed';
    pertState.current.weightKg = 15;
    pertState.current.medicationId = 'pancreaze';
    pertState.current.strengthValue = 37000;
    pertState.current.tubeFeed.formulaId = null;
    render(PertCalculator);
    expect(screen.getByText(/Enter weight and select a formula/)).toBeTruthy();
  });

  it('renders Oral hero capsulesPerDose numeral with class="num" for fixture row 0 inputs', () => {
    // Fixture row 0 oral xlsx default: weight 10, fat 25, lipase/g 2000, Creon 12000.
    // Calc layer derives totalLipase 50000, capsulesPerDose ROUND(50000/12000) = 4.
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 2000;
    render(PertCalculator);
    expect(screen.getByText('4', { selector: '.num' })).toBeTruthy();
  });

  it('renders Oral tertiary "Estimated daily total (3 meals/day)" eyebrow', () => {
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 2000;
    render(PertCalculator);
    expect(screen.getByText('Estimated daily total (3 meals/day)')).toBeTruthy();
  });

  it('does NOT render the tertiary in Tube-Feed mode (oral-only per D-09)', () => {
    pertState.current.mode = 'tube-feed';
    pertState.current.weightKg = 15;
    pertState.current.medicationId = 'pancreaze';
    pertState.current.strengthValue = 37000;
    pertState.current.tubeFeed.formulaId = 'kate-farms-ped-std-12';
    pertState.current.tubeFeed.volumePerDayMl = 1500;
    pertState.current.tubeFeed.lipasePerKgPerDay = 2500;
    render(PertCalculator);
    expect(screen.queryByText('Estimated daily total (3 meals/day)')).toBeNull();
  });

  it('renders Tube-Feed "Capsules per month" secondary with 150 numeral for fixture row 0 inputs', () => {
    // Fixture row 0 tube xlsx default: weight 15, kate-farms-ped-std-12 (fatG/L=48),
    // volume 1500, lipase/g 2500, Pancreaze 37000. Calc: totalFatG=72, totalLipase=180000,
    // capsulesPerDay ROUND(180000/37000) = 5, capsulesPerMonth = 5 * 30 = 150.
    pertState.current.mode = 'tube-feed';
    pertState.current.weightKg = 15;
    pertState.current.medicationId = 'pancreaze';
    pertState.current.strengthValue = 37000;
    pertState.current.tubeFeed.formulaId = 'kate-farms-ped-std-12';
    pertState.current.tubeFeed.volumePerDayMl = 1500;
    pertState.current.tubeFeed.lipasePerKgPerDay = 2500;
    render(PertCalculator);
    expect(screen.getByText('Capsules per month')).toBeTruthy();
    expect(screen.getByText('150', { selector: '.num' })).toBeTruthy();
  });

  it('STOP-red advisory fires with role="alert" + aria-live="assertive" for stopRedTrigger inputs', () => {
    // Dedicated STOP-red trigger row (CONTEXT D-08 + Q5):
    // weight 2, fat 50, lipase/g 4000, Creon 6000.
    // capsulesPerDose = ROUND(50*4000/6000) = ROUND(33.33) = 33.
    // dailyLipase = 33 * 6000 * 3 = 594000; cap = 2 * 10000 = 20000. Fires.
    pertState.current.weightKg = 2;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 6000;
    pertState.current.oral.fatGrams = 50;
    pertState.current.oral.lipasePerKgPerMeal = 4000;
    render(PertCalculator);
    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(alert.textContent ?? '').toMatch(/10,000 units/i);
  });

  it('warning advisory uses role="note" (NOT role="alert") for weight-out-of-range case', () => {
    // Weight 60 is over the advisory cap of 50 (pert-config.json
    // weight-out-of-range entry, value.max = 50). Other inputs kept benign so
    // the STOP-red cap does NOT fire (dailyLipase 36000 << weight*10000 = 600000).
    pertState.current.weightKg = 60;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 10;
    pertState.current.oral.lipasePerKgPerMeal = 1000;
    render(PertCalculator);
    expect(screen.queryByRole('alert')).toBeNull();
    const notes = screen.getAllByRole('note');
    expect(notes.length).toBeGreaterThan(0);
    const matched = notes.some((n) =>
      (n.textContent ?? '').includes('Outside expected pediatric range')
    );
    expect(matched).toBe(true);
  });

  it('hides secondaries on empty state (only weight set, other required inputs null)', () => {
    pertState.current.weightKg = 10;
    // medicationId, strengthValue, oral.fatGrams all stay null per defaults.
    render(PertCalculator);
    expect(screen.queryByText('Total lipase needed')).toBeNull();
    expect(screen.queryByText('Lipase per dose')).toBeNull();
  });
});
