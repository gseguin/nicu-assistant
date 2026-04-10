import type { NumericInputRange } from '$lib/shared/types.js';

export type FeedsMode = 'bedside' | 'full-nutrition';
export type TrophicFrequency = 'q3h' | 'q4h';
export type AdvanceCadence = 'every' | 'every-other' | 'every-3rd' | 'bid' | 'qd';

export interface FeedsStateData {
	mode: FeedsMode;
	weightKg: number | null;
	// Bedside (Sheet2)
	trophicMlKgDay: number | null;
	advanceMlKgDay: number | null;
	goalMlKgDay: number | null;
	trophicFrequency: TrophicFrequency;
	advanceCadence: AdvanceCadence;
	totalFluidsMlHr: number | null;
	// Full nutrition (Sheet1) — per D-03: explicit paired fields, NOT array
	tpnDex1Pct: number | null;
	tpnMl1Hr: number | null;
	tpnDex2Pct: number | null;
	tpnMl2Hr: number | null;
	smofMl: number | null;
	enteralMl: number | null;
	enteralKcalPerOz: number | null;
}

export interface FeedsInputRanges {
	weightKg: NumericInputRange;
	trophicMlKgDay: NumericInputRange;
	advanceMlKgDay: NumericInputRange;
	goalMlKgDay: NumericInputRange;
	totalFluidsMlHr: NumericInputRange;
	tpnDexPct: NumericInputRange;
	tpnMlHr: NumericInputRange;
	smofMl: NumericInputRange;
	enteralMl: NumericInputRange;
	enteralKcalPerOz: NumericInputRange;
}

export interface FrequencyOption {
	id: TrophicFrequency;
	label: string;
	feedsPerDay: number;
}

export interface CadenceOption {
	id: AdvanceCadence;
	label: string;
	type: 'relative' | 'absolute';
	/** For absolute: the fixed number. For relative: the divisor applied to feedsPerDay. */
	value: number;
}

export interface Advisory {
	id: string;
	field: string;
	comparator: 'gt' | 'lt' | 'range';
	value: number | [number, number];
	message: string;
	mode: 'bedside' | 'full-nutrition' | 'both';
}

export interface TriggeredAdvisory {
	id: string;
	message: string;
}

export interface BedsideResult {
	trophicMlPerFeed: number;
	trophicMlKgDay: number;
	advanceStepMlPerFeed: number;
	advanceMlKgDay: number;
	goalMlPerFeed: number;
	goalMlKgDay: number;
	totalFluidsMlHr: number;
	feedsPerDay: number;
	advanceEventsPerDay: number;
}

export interface FullNutritionResult {
	dextroseKcal: number;
	lipidKcal: number;
	enteralKcal: number;
	totalKcal: number;
	totalKcalPerKgDay: number;
	mlPerKg: number;
	autoAdvanceMlPerFeed: number;
}
