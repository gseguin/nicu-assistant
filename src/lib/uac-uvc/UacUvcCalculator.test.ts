import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UacUvcCalculator from './UacUvcCalculator.svelte';
import { uacUvcState } from './state.svelte.js';

// Plan 42.1-05 (D-08): inputs (NumericInput textbox + bits-ui Slider, bidirectionally
// synced) were extracted into UacUvcInputs.svelte. The calculator now renders the
// UAC + UVC hero grid only. The bidirectional-sync + sessionStorage round-trip
// coverage moved to UacUvcInputs.test.ts.

describe('UacUvcCalculator', () => {
  beforeEach(() => {
    // Isolation primitive — every test starts with fresh in-memory state + cleared storage
    uacUvcState.reset();
  });

  it('does not render input fields itself (extracted to UacUvcInputs in 42.1-05)', () => {
    render(UacUvcCalculator);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByLabelText('Weight')).toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('empty state: shows "Enter weight to compute depth" in both hero cards when weightKg is null', () => {
    uacUvcState.current.weightKg = null;
    render(UacUvcCalculator);
    const emptyStates = screen.getAllByText('Enter weight to compute depth');
    expect(emptyStates).toHaveLength(2); // one per card
  });

  it('valid input at 2.5 kg: renders UAC 16.5 and UVC 8.3 with prominent labels and unit', () => {
    uacUvcState.current.weightKg = 2.5;
    render(UacUvcCalculator);

    // Promoted labels: "UAC" / "UVC" carry visual prominence (text-title font-black);
    // "Arterial depth" / "Venous depth" sit as quieter secondary qualifiers.
    expect(screen.getByText('UAC')).toBeTruthy();
    expect(screen.getByText('UVC')).toBeTruthy();
    expect(screen.getByText('Arterial depth')).toBeTruthy();
    expect(screen.getByText('Venous depth')).toBeTruthy();
    expect(screen.getByText('16.5')).toBeTruthy(); // UAC @ 2.5 kg = 16.5 cm
    expect(screen.getByText('8.3')).toBeTruthy(); //  UVC @ 2.5 kg = 8.25 cm → toFixed(1) → "8.3"
    // "cm" unit appears in both hero cards. Post-42.1-05 the inputs (and their
    // suffix hints) live in a sibling component, so the calculator-only DOM
    // contains exactly two "cm" nodes.
    expect(screen.getAllByText('cm').length).toBeGreaterThanOrEqual(2);
  });

  it('sessionStorage round-trip: persist then init restores weightKg', () => {
    // reset() clears sessionStorage as part of its contract, so the naive
    // persist → reset → init chain would lose the persisted value at reset.
    // Simulate reload directly: write to sessionStorage, then call init().
    sessionStorage.setItem('nicu_uac_uvc_state', JSON.stringify({ weightKg: 7.5 }));
    uacUvcState.init();

    expect(uacUvcState.current.weightKg).toBe(7.5);
  });
});
