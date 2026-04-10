// xlsx Sheet2 hardcodes trophic /6, advance /8/2, goal /8, IV backfill /3.
// Our dropdowns parameterize these. The LOCKED parity fixture uses the xlsx's
// exact divisors and MUST NOT be edited to match new defaults.

import type { Advisory, BedsideResult, FullNutritionResult, TriggeredAdvisory } from './types.js';

/** kcal per gram of dextrose (Atwater factor for glucose monohydrate). */
export const DEXTROSE_KCAL_PER_GRAM = 3.4;

/** kcal per ml of SMOF 20% lipid emulsion (per xlsx Sheet1 B15 formula: =B7*2). */
export const LIPID_KCAL_PER_ML = 2;

/** ml per fluid ounce -- xlsx Sheet1 uses 30, not 29.5735. */
export const ML_PER_OZ = 30;

/** Hours per day -- for ml/hr to ml/day conversions. */
export const HOURS_PER_DAY = 24;

// ---------------------------------------------------------------------------
// Bedside advancement functions (Sheet2 formulas)
// ---------------------------------------------------------------------------

/**
 * Trophic ml per feed.
 *
 * xlsx Sheet2 C3: =C2*B3/6. The /6 is hardcoded q4h; we parameterize via feedsPerDay.
 */
export function calculateTrophicMlPerFeed(
	weightKg: number,
	trophicMlKgDay: number,
	feedsPerDay: number,
): number {
	return (weightKg * trophicMlKgDay) / feedsPerDay;
}

/**
 * Advance step ml per feed.
 *
 * xlsx Sheet2 C4: =C2*B4/8/2. The /8 is feeds_per_day, /2 is bid cadence;
 * we parameterize both via feedsPerDay and advanceEventsPerDay.
 */
export function calculateAdvanceStepMlPerFeed(
	weightKg: number,
	advanceMlKgDay: number,
	feedsPerDay: number,
	advanceEventsPerDay: number,
): number {
	return (weightKg * advanceMlKgDay) / feedsPerDay / advanceEventsPerDay;
}

/**
 * Goal ml per feed.
 *
 * xlsx Sheet2 C5: =C2*B5/8.
 */
export function calculateGoalMlPerFeed(
	weightKg: number,
	goalMlKgDay: number,
	feedsPerDay: number,
): number {
	return (weightKg * goalMlKgDay) / feedsPerDay;
}

/**
 * Total fluids ml/hr -- total daily volume (weight * goal) converted to ml/hr.
 *
 * xlsx Sheet2 B7: =C2*B5/24 (weight * goalMlKgDay / 24).
 */
export function calculateTotalFluidsMlHr(weightKg: number, goalMlKgDay: number): number {
	return (weightKg * goalMlKgDay) / HOURS_PER_DAY;
}

/**
 * IV backfill rate (ml/hr).
 *
 * xlsx Sheet2 B9: =B7-(B8/3). The /3 is q3h feed interval in hours;
 * we parameterize via feedHours.
 */
export function calculateIvBackfillRate(
	totalFluidsMlHr: number,
	enteralMlPerFeed: number,
	feedHours: number,
): number {
	return totalFluidsMlHr - enteralMlPerFeed / feedHours;
}

/**
 * Combined bedside advance calculation returning all results.
 *
 * Computes trophic, advance step, goal per-feed volumes plus total fluids.
 * Echo-backs trophicMlKgDay, advanceMlKgDay, goalMlKgDay for CORE-06.
 */
export function calculateBedsideAdvance(
	weightKg: number,
	trophicMlKgDay: number,
	advanceMlKgDay: number,
	goalMlKgDay: number,
	feedsPerDay: number,
	advanceEventsPerDay: number,
): BedsideResult {
	return {
		trophicMlPerFeed: calculateTrophicMlPerFeed(weightKg, trophicMlKgDay, feedsPerDay),
		trophicMlKgDay,
		advanceStepMlPerFeed: calculateAdvanceStepMlPerFeed(
			weightKg,
			advanceMlKgDay,
			feedsPerDay,
			advanceEventsPerDay,
		),
		advanceMlKgDay,
		goalMlPerFeed: calculateGoalMlPerFeed(weightKg, goalMlKgDay, feedsPerDay),
		goalMlKgDay,
		totalFluidsMlHr: calculateTotalFluidsMlHr(weightKg, goalMlKgDay),
		feedsPerDay,
		advanceEventsPerDay,
	};
}

// ---------------------------------------------------------------------------
// Full nutrition functions (Sheet1 formulas)
// ---------------------------------------------------------------------------

/**
 * Dextrose kcal from both TPN lines.
 *
 * xlsx Sheet1 B14: =((B3/100*B4)+(B5/100*B6))*3.4. Sums BOTH TPN lines.
 */
export function calculateDextroseKcal(
	dex1Pct: number,
	ml1: number,
	dex2Pct: number,
	ml2: number,
): number {
	return ((dex1Pct / 100) * ml1 + (dex2Pct / 100) * ml2) * DEXTROSE_KCAL_PER_GRAM;
}

/**
 * Lipid kcal from SMOF 20% emulsion.
 *
 * xlsx Sheet1 B15: =B7*2
 */
export function calculateLipidKcal(smofMl: number): number {
	return smofMl * LIPID_KCAL_PER_ML;
}

/**
 * Enteral kcal.
 *
 * xlsx Sheet1 B16: =(B10*B9)/30
 */
export function calculateEnteralKcal(enteralMl: number, enteralKcalPerOz: number): number {
	return (enteralMl * enteralKcalPerOz) / ML_PER_OZ;
}

/**
 * Full nutrition calculation combining all caloric sources.
 *
 * xlsx Sheet1 B14-B18 + B20:
 *   B14 = dextroseKcal (both lines)
 *   B15 = lipidKcal
 *   B16 = enteralKcal
 *   B17 = totalKcal (B14+B15+B16)
 *   B18 = totalKcalPerKgDay (B17/B13)
 *   B20 = autoAdvanceMlPerFeed (B13*30/8/2 -- hardcoded to q3h/bid)
 */
export function calculateFullNutrition(
	weightKg: number,
	dex1Pct: number,
	ml1: number,
	dex2Pct: number,
	ml2: number,
	smofMl: number,
	enteralMl: number,
	enteralKcalPerOz: number,
): FullNutritionResult {
	const dextroseKcal = calculateDextroseKcal(dex1Pct, ml1, dex2Pct, ml2);
	const lipidKcal = calculateLipidKcal(smofMl);
	const enteralKcal = calculateEnteralKcal(enteralMl, enteralKcalPerOz);
	const totalKcal = dextroseKcal + lipidKcal + enteralKcal;

	return {
		dextroseKcal,
		lipidKcal,
		enteralKcal,
		totalKcal,
		totalKcalPerKgDay: totalKcal / weightKg,
		mlPerKg: (ml1 + ml2 + enteralMl) / weightKg,
		// xlsx B20: =B13*30/8/2 -- hardcoded to q3h (8 feeds) / bid (2 advances)
		autoAdvanceMlPerFeed: (weightKg * 30) / 8 / 2,
	};
}

// ---------------------------------------------------------------------------
// Advisory checking (data-driven from config)
// ---------------------------------------------------------------------------

/**
 * Check advisory thresholds against current inputs and results.
 *
 * Pure function. Takes input values, calculation results, current mode, and
 * the advisory config array. Returns only triggered advisories.
 *
 * Special case: "trophic-exceeds-advance" compares trophicMlKgDay > advanceMlKgDay
 * rather than checking a single field against a threshold.
 */
export function checkAdvisories(
	inputs: Record<string, number | null>,
	results: Record<string, number>,
	mode: 'bedside' | 'full-nutrition',
	advisoryConfig: Advisory[],
): TriggeredAdvisory[] {
	const triggered: TriggeredAdvisory[] = [];

	for (const advisory of advisoryConfig) {
		// Filter by mode
		if (advisory.mode !== mode && advisory.mode !== 'both') continue;

		// Special case: cross-field comparison
		if (advisory.id === 'trophic-exceeds-advance') {
			const trophic = inputs['trophicMlKgDay'];
			const advance = inputs['advanceMlKgDay'];
			if (trophic != null && advance != null && trophic > advance) {
				triggered.push({ id: advisory.id, message: advisory.message });
			}
			continue;
		}

		// Standard field-based threshold check
		const fieldValue = results[advisory.field] ?? inputs[advisory.field];
		if (fieldValue == null) continue;

		let isTriggered = false;
		if (advisory.comparator === 'gt' && typeof advisory.value === 'number') {
			isTriggered = fieldValue > advisory.value;
		} else if (advisory.comparator === 'lt' && typeof advisory.value === 'number') {
			isTriggered = fieldValue < advisory.value;
		} else if (advisory.comparator === 'range' && Array.isArray(advisory.value)) {
			isTriggered = fieldValue < advisory.value[0] || fieldValue > advisory.value[1];
		}

		if (isTriggered) {
			triggered.push({ id: advisory.id, message: advisory.message });
		}
	}

	return triggered;
}
