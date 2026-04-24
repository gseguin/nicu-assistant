// src/lib/uac-uvc/UacUvcInputs.test.ts
// Co-located component test for the inputs fragment extracted in Plan 42.1-05 (D-08).
// Covers the NumericInput textbox + bits-ui Slider bidirectional sync that
// previously lived in UacUvcCalculator.test.ts.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UacUvcInputs from './UacUvcInputs.svelte';
import { uacUvcState } from './state.svelte.js';

describe('UacUvcInputs', () => {
  beforeEach(() => {
    uacUvcState.reset();
  });

  it('renders both the textbox and the slider', () => {
    render(UacUvcInputs);
    expect(screen.getByLabelText('Weight')).toBeTruthy();
    expect(screen.getByRole('slider')).toBeTruthy();
    expect(screen.getByRole('slider').getAttribute('aria-label')).toBe('Weight slider');
  });

  it('bidirectional sync — slider to textbox: ArrowRight step updates state and textbox', async () => {
    uacUvcState.current.weightKg = 5;
    render(UacUvcInputs);
    const thumb = screen.getByRole('slider') as HTMLElement;

    // bits-ui Slider moves by `step` on ArrowRight (step = 0.1 -> 5.1)
    thumb.focus();
    await fireEvent.keyDown(thumb, { key: 'ArrowRight' });

    expect(uacUvcState.current.weightKg).toBeCloseTo(5.1, 5);
    // Textbox reflects the new value via bind:value on NumericInput
    const textbox = screen.getByLabelText('Weight') as HTMLInputElement;
    expect(parseFloat(textbox.value)).toBeCloseTo(5.1, 5);
  });

  it('bidirectional sync — textbox to slider: typing 1.0 updates state and slider aria-valuenow', async () => {
    render(UacUvcInputs);
    const textbox = screen.getByLabelText('Weight') as HTMLInputElement;
    await fireEvent.input(textbox, { target: { value: '1.0' } });

    expect(uacUvcState.current.weightKg).toBe(1.0);
    const thumb = screen.getByRole('slider') as HTMLElement;
    expect(Number(thumb.getAttribute('aria-valuenow'))).toBe(1.0);
  });

  it('null weight falls back to slider min on the slider thumb', () => {
    uacUvcState.current.weightKg = null;
    render(UacUvcInputs);
    const thumb = screen.getByRole('slider') as HTMLElement;
    // From config: weightKg.min = 0.3
    expect(Number(thumb.getAttribute('aria-valuenow'))).toBe(0.3);
  });
});
