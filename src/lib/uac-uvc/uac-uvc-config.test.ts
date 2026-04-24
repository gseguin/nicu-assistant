import { describe, it, expect } from 'vitest';
import { defaults, inputs } from './uac-uvc-config.js';

describe('uac-uvc-config shape', () => {
  it('defaults match xlsx B2/B6 reference example (2.5 kg)', () => {
    expect(defaults.weightKg).toBe(2.5);
  });

  it('inputs define advisory range for weightKg (0.3–10 kg step 0.1)', () => {
    expect(inputs.weightKg).toEqual({ min: 0.3, max: 10, step: 0.1 });
  });
});
