import type { UacUvcInputRanges } from './types.js';
import config from './uac-uvc-config.json';

export const defaults = config.defaults as {
  weightKg: number;
};
export const inputs: UacUvcInputRanges = config.inputs as UacUvcInputRanges;
