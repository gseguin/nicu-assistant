// Component input-wiring tests for PertInputs.svelte (CONTEXT D-07 + D-11 + D-14).
// Mirrors src/lib/feeds/FeedAdvanceInputs.test.ts pattern: pertState.reset() in
// beforeEach, render(), fireEvent.click() on tabs, then assert state mutations.
//
// Em-dash ban (Phase 3 Q1): this file contains zero U+2014 / U+2013 characters.
// All separators are ASCII period or colon.
//
// Scope: this file asserts the input-binding surface only. The shared
// SegmentedToggle keyboard-nav is covered by SegmentedToggle.test.ts (Phase 1
// frozen). The D-11 strength-reset effect is exercised here via direct state
// mutation (the SelectPicker dialog polyfill is flaky in jsdom per Pitfall 5).

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PertInputs from './PertInputs.svelte';
import { pertState } from './state.svelte.js';

describe('PertInputs input wiring', () => {
  beforeEach(() => {
    pertState.reset();
  });

  it('renders Weight input + mode toggle in the shared card', () => {
    render(PertInputs);
    expect(screen.getByLabelText('Weight')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Oral/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Tube-Feed/i })).toBeTruthy();
  });

  it('Oral mode renders Fat per meal + Lipase per gram of fat', () => {
    pertState.current.mode = 'oral';
    render(PertInputs);
    expect(screen.getByLabelText('Fat per meal')).toBeTruthy();
    const lipaseLabels = screen.getAllByLabelText(/Lipase per gram of fat/);
    expect(lipaseLabels).toHaveLength(1);
  });

  it('Tube-Feed mode renders Formula + Volume per day + Lipase per gram of fat', () => {
    pertState.current.mode = 'tube-feed';
    render(PertInputs);
    expect(screen.getByLabelText('Volume per day')).toBeTruthy();
    expect(screen.getByLabelText('Formula')).toBeTruthy();
    const lipaseLabels = screen.getAllByLabelText(/Lipase per gram of fat/);
    expect(lipaseLabels).toHaveLength(1);
  });

  it('clicking the Tube-Feed tab updates pertState.current.mode (binding test)', async () => {
    pertState.current.weightKg = 10;
    render(PertInputs);
    const tubeFeedTab = screen.getByRole('tab', { name: /Tube-Feed/i });
    await fireEvent.click(tubeFeedTab);
    expect(pertState.current.mode).toBe('tube-feed');
    // Weight is shared across modes (PERT-MODE-03); preserved across the toggle.
    expect(pertState.current.weightKg).toBe(10);
  });

  it('mode-switch preserves shared inputs and mode-specific oral fields per D-07', async () => {
    pertState.current.mode = 'oral';
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 2000;
    render(PertInputs);
    const tubeFeedTab = screen.getByRole('tab', { name: /Tube-Feed/i });
    await fireEvent.click(tubeFeedTab);
    expect(pertState.current.mode).toBe('tube-feed');
    expect(pertState.current.weightKg).toBe(10);
    expect(pertState.current.medicationId).toBe('creon');
    expect(pertState.current.strengthValue).toBe(12000);
    expect(pertState.current.oral.fatGrams).toBe(25);
    expect(pertState.current.oral.lipasePerKgPerMeal).toBe(2000);
  });

  it('D-11: changing medicationId resets strengthValue to null', async () => {
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    render(PertInputs);
    // Mutate medicationId directly. The lastMedId-tracking $effect in
    // PertInputs.svelte:140-147 detects the change and clears strengthValue.
    // Promise.resolve flushes microtasks so the rune effect can settle.
    pertState.current.medicationId = 'zenpep';
    await Promise.resolve();
    await Promise.resolve();
    expect(pertState.current.strengthValue).toBeNull();
  });

  it('D-14: every numeric input has inputmode="decimal"', () => {
    render(PertInputs);
    const numericInputs = screen.getAllByRole('spinbutton');
    expect(numericInputs.length).toBeGreaterThan(0);
    for (const input of numericInputs) {
      expect(input.getAttribute('inputmode')).toBe('decimal');
    }
  });
});
