// src/lib/gir/GirInputs.test.ts
// Co-located component test for the inputs fragment extracted in Plan 42.1-05 (D-08).
// Covers the three NumericInput labels + the dextrose-input advisory (which travels
// with the input, not the result).
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GirInputs from './GirInputs.svelte';
import { girState } from './state.svelte.js';

describe('GirInputs', () => {
  beforeEach(() => {
    girState.reset();
  });

  it('renders three input fields with correct labels', () => {
    render(GirInputs);
    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons).toHaveLength(3);

    expect(screen.getByLabelText('Weight')).toBeTruthy();
    expect(screen.getByLabelText('Dextrose')).toBeTruthy();
    expect(screen.getByLabelText('Fluid order')).toBeTruthy();
  });

  it('surfaces amber Dextrose >12.5% advisory when dextrose exceeds threshold', () => {
    girState.current.dextrosePct = 15;
    render(GirInputs);
    expect(screen.getByText(/Dextrose >12\.5% requires central venous access/)).toBeTruthy();
  });

  it('hides the dextrose advisory when dextrose <= 12.5%', () => {
    girState.current.dextrosePct = 12.5;
    render(GirInputs);
    expect(screen.queryByText(/Dextrose >12\.5% requires central venous access/)).toBeNull();
  });

  it('user input on Weight updates girState.current.weightKg', async () => {
    render(GirInputs);
    const weight = screen.getByLabelText('Weight') as HTMLInputElement;
    await fireEvent.input(weight, { target: { value: '4.2' } });
    expect(girState.current.weightKg).toBe(4.2);
  });
});
