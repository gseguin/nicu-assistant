import type { GirInputRanges, GlucoseBucket } from './types.js';
import config from './gir-config.json';

export const defaults = config.defaults as {
  weightKg: number;
  dextrosePct: number;
  mlPerKgPerDay: number;
};
export const inputs: GirInputRanges = config.inputs as GirInputRanges;
export const glucoseBuckets: GlucoseBucket[] = config.glucoseBuckets as GlucoseBucket[];

export function getBucketById(id: string): GlucoseBucket | undefined {
  return glucoseBuckets.find((b) => b.id === id);
}
