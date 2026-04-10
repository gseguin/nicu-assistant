import type { FeedsInputRanges, FrequencyOption, CadenceOption, Advisory } from './types.js';
import config from './feeds-config.json';

export const defaults = config.defaults as {
	weightKg: number;
	trophicMlKgDay: number;
	advanceMlKgDay: number;
	goalMlKgDay: number;
	trophicFrequency: string;
	advanceCadence: string;
	totalFluidsMlHr: number;
	tpnDex1Pct: number;
	tpnMl1Hr: number;
	tpnDex2Pct: number;
	tpnMl2Hr: number;
	smofMl: number;
	enteralMl: number;
	enteralKcalPerOz: number;
};

export const inputs: FeedsInputRanges = config.inputs as FeedsInputRanges;
export const frequencyOptions: FrequencyOption[] = config.dropdowns.frequency as FrequencyOption[];
export const cadenceOptions: CadenceOption[] = config.dropdowns.cadence as CadenceOption[];
export const advisories: Advisory[] = config.advisories as Advisory[];

export function getFrequencyById(id: string): FrequencyOption | undefined {
	return frequencyOptions.find((f) => f.id === id);
}

export function getCadenceById(id: string): CadenceOption | undefined {
	return cadenceOptions.find((c) => c.id === id);
}

/**
 * Resolve advance events per day from cadence option and feeds per day.
 * - Relative cadences (every, every-other, every-3rd): feedsPerDay / value
 * - Absolute cadences (bid, qd): value directly
 */
export function resolveAdvanceEventsPerDay(cadence: CadenceOption, feedsPerDay: number): number {
	return cadence.type === 'absolute' ? cadence.value : feedsPerDay / cadence.value;
}
