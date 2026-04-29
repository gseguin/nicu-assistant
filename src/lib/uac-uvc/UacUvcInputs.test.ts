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

  it('slider thumb has tabindex=-1 (iOS form-chain regression sentinel)', () => {
    // Regression guard for the iOS Safari keyboard-accessory-bar prev/next bug.
    // bits-ui sets tabindex=0 internally; RangedNumericInput overrides to -1
    // post-mount via a $effect. If this assertion fails, the iPhone keyboard
    // arrows will dead-end at the slider thumb (or skip past adjacent inputs).
    render(UacUvcInputs);
    const thumb = screen.getByRole('slider') as HTMLElement;
    expect(thumb.tabIndex).toBe(-1);
  });

  it('bidirectional sync — slider to textbox: ArrowRight step updates state and textbox', async () => {
    uacUvcState.current.weightKg = 5;
    render(UacUvcInputs);
    const thumb = screen.getByRole('slider') as HTMLElement;

    // bits-ui Slider moves by `step` on ArrowRight (step = 0.1 -> 5.1).
    // keydown / focus marks the slider as user-interacted so the write is accepted.
    thumb.focus();
    await fireEvent.keyDown(thumb, { key: 'ArrowRight' });

    expect(uacUvcState.current.weightKg).toBeCloseTo(5.1, 5);
    const textbox = screen.getByLabelText('Weight') as HTMLInputElement;
    expect(parseFloat(textbox.value)).toBeCloseTo(5.1, 5);
  });

  it('bidirectional sync — textbox to slider: typing 1.37 keeps state-precision; slider snaps to step', async () => {
    render(UacUvcInputs);
    const textbox = screen.getByLabelText('Weight') as HTMLInputElement;
    // typeStep=0.01 lets the textbox accept fine-grained values; slider step is 0.1.
    await fireEvent.input(textbox, { target: { value: '1.37' } });

    expect(uacUvcState.current.weightKg).toBe(1.37);
    const thumb = screen.getByRole('slider') as HTMLElement;
    // Slider mirror snaps to the nearest 0.1-step anchored at min (0.3):
    // 1.37 -> round((1.37 - 0.3)/0.1) = 11, mirror = 0.3 + 11*0.1 = 1.4.
    expect(Number(thumb.getAttribute('aria-valuenow'))).toBeCloseTo(1.4, 5);
  });

  it('null weight falls back to slider min on the slider thumb', () => {
    uacUvcState.current.weightKg = null;
    render(UacUvcInputs);
    const thumb = screen.getByRole('slider') as HTMLElement;
    // From config: weightKg.min = 0.3
    expect(Number(thumb.getAttribute('aria-valuenow'))).toBe(0.3);
  });
});
