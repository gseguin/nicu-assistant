import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UacUvcCalculator from './UacUvcCalculator.svelte';
import { uacUvcState } from './state.svelte.js';

describe('UacUvcCalculator', () => {
  beforeEach(() => {
    // Isolation primitive — every test starts with fresh in-memory state + cleared storage
    uacUvcState.reset();
  });

  it('empty state: shows "Enter weight to compute depth" in both hero cards when weightKg is null', () => {
    uacUvcState.current.weightKg = null;
    render(UacUvcCalculator);
    const emptyStates = screen.getAllByText('Enter weight to compute depth');
    expect(emptyStates).toHaveLength(2); // one per card
  });

  it('valid input at 2.5 kg: renders UAC 16.5 and UVC 8.3 with card labels and unit', () => {
    uacUvcState.current.weightKg = 2.5;
    render(UacUvcCalculator);

    expect(screen.getByText('UAC')).toBeTruthy();
    expect(screen.getByText('UVC')).toBeTruthy();
    expect(screen.getByText('Arterial depth')).toBeTruthy();
    expect(screen.getByText('Venous depth')).toBeTruthy();
    expect(screen.getByText('16.5')).toBeTruthy(); // UAC @ 2.5 kg = 16.5 cm
    expect(screen.getByText('8.3')).toBeTruthy(); //  UVC @ 2.5 kg = 8.25 cm → toFixed(1) → "8.3"
    // "cm" unit appears in both hero cards (and possibly in NumericInput hints)
    expect(screen.getAllByText('cm').length).toBeGreaterThanOrEqual(2);
  });

  it('bidirectional sync — slider to textbox: slider ArrowRight step updates state and textbox', async () => {
    uacUvcState.current.weightKg = 5;
    render(UacUvcCalculator);
    const thumb = screen.getByRole('slider') as HTMLElement;

    // bits-ui Slider moves by `step` on ArrowRight (step = 0.1 → 5.1)
    thumb.focus();
    await fireEvent.keyDown(thumb, { key: 'ArrowRight' });

    expect(uacUvcState.current.weightKg).toBeCloseTo(5.1, 5);
    // Textbox reflects the new value via bind:value on NumericInput
    const textbox = screen.getByLabelText('Weight') as HTMLInputElement;
    expect(parseFloat(textbox.value)).toBeCloseTo(5.1, 5);
  });

  it('bidirectional sync — textbox to slider: typing 1.0 in textbox updates state and slider aria-valuenow', async () => {
    render(UacUvcCalculator);
    const textbox = screen.getByLabelText('Weight') as HTMLInputElement;
    await fireEvent.input(textbox, { target: { value: '1.0' } });

    expect(uacUvcState.current.weightKg).toBe(1.0);
    const thumb = screen.getByRole('slider') as HTMLElement;
    expect(Number(thumb.getAttribute('aria-valuenow'))).toBe(1.0);
  });

  it('sessionStorage round-trip: persist then reset-and-init restores weightKg', () => {
    // reset() clears sessionStorage as part of its contract, so the naive
    // persist → reset → init chain would lose the persisted value at reset.
    // Simulate reload directly: write to sessionStorage, then call init().
    sessionStorage.setItem('nicu_uac_uvc_state', JSON.stringify({ weightKg: 7.5 }));
    uacUvcState.init();

    expect(uacUvcState.current.weightKg).toBe(7.5);
  });
});
