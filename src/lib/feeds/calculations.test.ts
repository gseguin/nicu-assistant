import { describe, it, expect } from 'vitest';
import {
	calculateTrophicMlPerFeed,
	calculateAdvanceStepMlPerFeed,
	calculateGoalMlPerFeed,
	calculateTotalFluidsMlHr,
	calculateIvBackfillRate,
	calculateBedsideAdvance,
	calculateDextroseKcal,
	calculateLipidKcal,
	calculateEnteralKcal,
	calculateFullNutrition,
	checkAdvisories,
} from './calculations.js';
import {
	frequencyOptions,
	cadenceOptions,
	resolveAdvanceEventsPerDay,
	advisories,
} from './feeds-config.js';
import fixtures from './feeds-parity.fixtures.json';

const EPSILON = 0.01; // 1% relative
const ABS_FLOOR = 0.5; // absolute floor for small values (kcal or ml)

function closeEnough(actual: number, expected: number): boolean {
	const absDiff = Math.abs(actual - expected);
	if (absDiff <= ABS_FLOOR) return true;
	if (expected === 0) return absDiff < EPSILON;
	return Math.abs(absDiff / expected) <= EPSILON;
}

// ---------------------------------------------------------------------------
// Sheet2 parity — bedside advancement (TEST-02 / CORE-09)
// ---------------------------------------------------------------------------

describe('Feed Advance — xlsx Sheet2 spreadsheet parity (locked)', () => {
	const s2 = fixtures.sheet2;

	it('trophicMlPerFeed matches xlsx C3 within 1%', () => {
		const actual = calculateTrophicMlPerFeed(
			s2.input.weightKg,
			s2.input.trophicMlKgDay,
			s2.input.trophicFeedsPerDay,
		);
		expect(closeEnough(actual, s2.expected.trophicMlPerFeed)).toBe(true);
	});

	it('advanceStepMlPerFeed matches xlsx C4 within 1%', () => {
		const actual = calculateAdvanceStepMlPerFeed(
			s2.input.weightKg,
			s2.input.advanceMlKgDay,
			s2.input.advanceFeedsPerDay,
			s2.input.advanceEventsPerDay,
		);
		expect(closeEnough(actual, s2.expected.advanceStepMlPerFeed)).toBe(true);
	});

	it('goalMlPerFeed matches xlsx C5 within 1%', () => {
		const actual = calculateGoalMlPerFeed(
			s2.input.weightKg,
			s2.input.goalMlKgDay,
			s2.input.goalFeedsPerDay,
		);
		expect(closeEnough(actual, s2.expected.goalMlPerFeed)).toBe(true);
	});

	it('ivBackfillRate matches xlsx B9', () => {
		const bf = fixtures.sheet2IvBackfill;
		const actual = calculateIvBackfillRate(
			bf.input.totalFluidsMlHr,
			bf.input.enteralMlPerFeed,
			bf.input.feedHours,
		);
		expect(actual).toBe(bf.expected.ivBackfillRate);
	});

	it('calculateBedsideAdvance aggregator returns consistent results', () => {
		const result = calculateBedsideAdvance(
			s2.input.weightKg,
			s2.input.trophicMlKgDay,
			s2.input.advanceMlKgDay,
			s2.input.goalMlKgDay,
			s2.input.advanceFeedsPerDay,
			s2.input.advanceEventsPerDay,
		);
		expect(closeEnough(result.advanceStepMlPerFeed, s2.expected.advanceStepMlPerFeed)).toBe(true);
		expect(closeEnough(result.goalMlPerFeed, s2.expected.goalMlPerFeed)).toBe(true);
		expect(result.feedsPerDay).toBe(s2.input.advanceFeedsPerDay);
		expect(result.advanceEventsPerDay).toBe(s2.input.advanceEventsPerDay);
	});
});

// ---------------------------------------------------------------------------
// Sheet1 parity — full nutrition (TEST-01 / FULL-07)
// ---------------------------------------------------------------------------

describe('Feed Advance — xlsx Sheet1 spreadsheet parity (locked)', () => {
	const s1 = fixtures.sheet1;

	it('enteralKcal matches xlsx B16', () => {
		const actual = calculateEnteralKcal(s1.input.enteralMl, s1.input.enteralKcalPerOz);
		expect(closeEnough(actual, s1.expected.enteralKcal)).toBe(true);
	});

	it('dextroseKcal is 0 for 0% dextrose', () => {
		const actual = calculateDextroseKcal(
			s1.input.tpnDex1Pct,
			s1.input.tpnMl1,
			s1.input.tpnDex2Pct,
			s1.input.tpnMl2,
		);
		expect(actual).toBe(s1.expected.dextroseKcal);
	});

	it('lipidKcal is 0 for 0 ml SMOF', () => {
		const actual = calculateLipidKcal(s1.input.smofMl);
		expect(actual).toBe(s1.expected.lipidKcal);
	});

	it('calculateFullNutrition totalKcalPerKgDay matches xlsx B18 within 1%', () => {
		const result = calculateFullNutrition(
			s1.input.weightKg,
			s1.input.tpnDex1Pct,
			s1.input.tpnMl1,
			s1.input.tpnDex2Pct,
			s1.input.tpnMl2,
			s1.input.smofMl,
			s1.input.enteralMl,
			s1.input.enteralKcalPerOz,
		);
		expect(closeEnough(result.dextroseKcal, s1.expected.dextroseKcal)).toBe(true);
		expect(closeEnough(result.lipidKcal, s1.expected.lipidKcal)).toBe(true);
		expect(closeEnough(result.enteralKcal, s1.expected.enteralKcal)).toBe(true);
		expect(closeEnough(result.totalKcalPerKgDay, s1.expected.totalKcalPerKgDay)).toBe(true);
		expect(closeEnough(result.mlPerKg, s1.expected.mlPerKg)).toBe(true);
		expect(closeEnough(result.autoAdvanceMlPerFeed, s1.expected.autoAdvanceMlPerFeed)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Dual dextrose line (FULL-04 / P2 prevention)
// ---------------------------------------------------------------------------

describe('dextrose kcal sums BOTH lines', () => {
	const dd = fixtures.sheet1DualDex;

	it('with both TPN lines non-zero, dextroseKcal sums both', () => {
		const actual = calculateDextroseKcal(
			dd.input.tpnDex1Pct,
			dd.input.tpnMl1,
			dd.input.tpnDex2Pct,
			dd.input.tpnMl2,
		);
		expect(actual).toBeCloseTo(dd.expected.dextroseKcal, 4);
	});

	it('full nutrition result includes dual-line dextrose kcal', () => {
		const result = calculateFullNutrition(
			dd.input.weightKg,
			dd.input.tpnDex1Pct,
			dd.input.tpnMl1,
			dd.input.tpnDex2Pct,
			dd.input.tpnMl2,
			dd.input.smofMl,
			dd.input.enteralMl,
			dd.input.enteralKcalPerOz,
		);
		expect(result.dextroseKcal).toBeCloseTo(dd.expected.dextroseKcal, 4);
		expect(result.totalKcal).toBeGreaterThan(dd.expected.dextroseKcal);
	});
});

// ---------------------------------------------------------------------------
// Parameter matrix — internal consistency (TEST-03 / D-15)
// ---------------------------------------------------------------------------

describe('Feed Advance — parameter matrix (internal consistency)', () => {
	const WEIGHT = 2;
	const ADVANCE_ML_KG_DAY = 30;

	it('every frequency x cadence combo returns positive advanceStepMlPerFeed', () => {
		for (const freq of frequencyOptions) {
			for (const cad of cadenceOptions) {
				const eventsPerDay = resolveAdvanceEventsPerDay(cad, freq.feedsPerDay);
				const step = calculateAdvanceStepMlPerFeed(
					WEIGHT,
					ADVANCE_ML_KG_DAY,
					freq.feedsPerDay,
					eventsPerDay,
				);
				expect(step, `${freq.id} x ${cad.id}`).toBeGreaterThan(0);
			}
		}
	});

	it('changing frequency changes feedsPerDay', () => {
		const q3h = frequencyOptions.find((f) => f.id === 'q3h')!;
		const q4h = frequencyOptions.find((f) => f.id === 'q4h')!;
		expect(q3h.feedsPerDay).toBe(8);
		expect(q4h.feedsPerDay).toBe(6);
		expect(q3h.feedsPerDay).not.toBe(q4h.feedsPerDay);
	});

	it('relative cadence varies with frequency, absolute does not', () => {
		const bid = cadenceOptions.find((c) => c.id === 'bid')!;
		expect(bid.type).toBe('absolute');
		expect(resolveAdvanceEventsPerDay(bid, 8)).toBe(2);
		expect(resolveAdvanceEventsPerDay(bid, 6)).toBe(2);

		const everyOther = cadenceOptions.find((c) => c.id === 'every-other')!;
		expect(everyOther.type).toBe('relative');
		expect(resolveAdvanceEventsPerDay(everyOther, 8)).toBe(4);
		expect(resolveAdvanceEventsPerDay(everyOther, 6)).toBe(3);
	});

	it('every-3rd with q3h = 8/3 advances per day (non-integer)', () => {
		const every3rd = cadenceOptions.find((c) => c.id === 'every-3rd')!;
		const result = resolveAdvanceEventsPerDay(every3rd, 8);
		expect(result).toBeCloseTo(8 / 3, 10);
	});

	it('formula consistency: daily advance volume is weight * advanceMlKgDay', () => {
		for (const freq of frequencyOptions) {
			for (const cad of cadenceOptions) {
				const eventsPerDay = resolveAdvanceEventsPerDay(cad, freq.feedsPerDay);
				const step = calculateAdvanceStepMlPerFeed(
					WEIGHT,
					ADVANCE_ML_KG_DAY,
					freq.feedsPerDay,
					eventsPerDay,
				);
				// step * eventsPerDay should equal weight * advanceMlKgDay / feedsPerDay
				// (the daily advance allocated across events, per feed)
				const dailyFromStep = step * eventsPerDay * freq.feedsPerDay;
				const dailyFromFormula = WEIGHT * ADVANCE_ML_KG_DAY;
				expect(dailyFromStep).toBeCloseTo(dailyFromFormula, 8);
			}
		}
	});
});

// ---------------------------------------------------------------------------
// Advisory checking (TEST-02)
// ---------------------------------------------------------------------------

describe('checkAdvisories', () => {
	it('trophic-exceeds-advance triggers when trophicMlKgDay > advanceMlKgDay', () => {
		const inputs = { trophicMlKgDay: 25, advanceMlKgDay: 20 };
		const results = {};
		const triggered = checkAdvisories(inputs, results, 'bedside', advisories);
		expect(triggered.some((t) => t.id === 'trophic-exceeds-advance')).toBe(true);
	});

	it('trophic-exceeds-advance does NOT trigger when trophic <= advance', () => {
		const inputs = { trophicMlKgDay: 20, advanceMlKgDay: 30 };
		const results = {};
		const triggered = checkAdvisories(inputs, results, 'bedside', advisories);
		expect(triggered.some((t) => t.id === 'trophic-exceeds-advance')).toBe(false);
	});

	it('dextrose-high triggers when tpnDex1Pct > 12.5', () => {
		const inputs = { tpnDex1Pct: 15 };
		const results = {};
		const triggered = checkAdvisories(inputs, results, 'full-nutrition', advisories);
		expect(triggered.some((t) => t.id === 'dextrose-high-line1')).toBe(true);
	});

	it('total-kcal-high triggers when totalKcalPerKgDay > 140', () => {
		const inputs = {};
		const results = { totalKcalPerKgDay: 150 };
		const triggered = checkAdvisories(inputs, results, 'full-nutrition', advisories);
		expect(triggered.some((t) => t.id === 'total-kcal-high')).toBe(true);
	});

	it('bedside advisories do not trigger in full-nutrition mode', () => {
		const inputs = { trophicMlKgDay: 25, advanceMlKgDay: 20 };
		const results = {};
		const triggered = checkAdvisories(inputs, results, 'full-nutrition', advisories);
		expect(triggered.some((t) => t.id === 'trophic-exceeds-advance')).toBe(false);
	});

	it('full-nutrition advisories do not trigger in bedside mode', () => {
		const inputs = { tpnDex1Pct: 15 };
		const results = {};
		const triggered = checkAdvisories(inputs, results, 'bedside', advisories);
		expect(triggered.some((t) => t.id === 'dextrose-high-line1')).toBe(false);
	});
});
