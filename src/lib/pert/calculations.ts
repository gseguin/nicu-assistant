// Pure-function math layer for PERT (Pancreatic Enzyme Replacement Therapy) dosing.
//
// All formulas are xlsx-canonical per CONTEXT D-15 + D-16 + D-12 (user-locked
// 2026-04-25). The parity authority is `epi-pert-calculator.xlsx` at the
// workstream root (D-18); cell references in JSDoc point back to the workbook
// so a clinical reviewer can grep one place to verify the math.
//
// All capsule rounding uses `Math.round` (= xlsx ROUND), NOT `Math.ceil` /
// ROUNDUP. The 10,000 units/kg/day STOP-red cap (PERT-SAFE-01 / D-03) catches
// the dangerous direction independently.
//
// This module is PURE TS — no imports from `./state.svelte.js`, no imports of
// `./config.js` or `pert-config.json`, no Svelte reactivity, no localStorage.
// The component layer (Plan 04) wires state + config to these functions.

import type {
  Advisory,
  AdvisorySeverity,
  PertMode,
  PertOralResult,
  PertStateData,
  PertTubeFeedResult,
  TriggeredAdvisory
} from './types.js';

/**
 * FDA-published max lipase cap (units per kg per day) — PERT-SAFE-01.
 * Hard-coded literal per CONTEXT D-03; the matching `max-lipase-cap` advisory
 * entry in `pert-config.json` keeps `field: "computed"` + `comparator: "gt"`
 * + `value: 0` as a marker so the JSON-driven render pipeline finds the
 * message + severity. The actual threshold check happens here.
 */
export const MAX_LIPASE_PER_KG_PER_DAY = 10000;

/**
 * Inputs for {@link computeOralResult}. Subset of state — fully resolvable to
 * numbers (the caller is expected to gate on null inputs before calling).
 *
 * Note on naming: `lipasePerKgPerMeal` keeps the legacy JSON key per D-17 for
 * state-schema continuity, but in the calculation it represents **lipase
 * units per gram of fat** (xlsx oral B6).
 */
export interface OralCalcInputs {
  fatGrams: number;
  lipasePerKgPerMeal: number;
  strengthValue: number;
}

/**
 * Inputs for {@link computeTubeFeedResult}.
 *
 * Note on naming: `lipasePerKgPerDay` keeps the legacy JSON key per D-17 for
 * state-schema continuity, but in the calculation it represents **lipase
 * units per gram of fat** (xlsx tube B9).
 */
export interface TubeFeedCalcInputs {
  formulaFatGPerL: number;
  volumePerDayMl: number;
  lipasePerKgPerDay: number;
  weightKg: number;
  strengthValue: number;
}

/**
 * Compute oral PERT result.
 *
 * xlsx-canonical formula (D-15, user-locked 2026-04-25):
 *   totalLipase         = fatGrams × lipasePerKgPerMeal       (xlsx oral B9 = B5*B6)
 *   capsulesPerDose     = Math.round(totalLipase / strengthValue)   (xlsx B10 = ROUND(B9/B8, 0))
 *   lipasePerDose       = capsulesPerDose × strengthValue     (display secondary)
 *   estimatedDailyTotal = capsulesPerDose × 3                 (PERT-ORAL-08 — 3 meals/day)
 *
 * Returns zeros if any input is null/NaN, ≤ 0, or strengthValue is 0
 * (defensive — Plan 04's empty-state gate prevents this from rendering anyway,
 * but the math layer never produces Infinity / NaN per D-02).
 */
export function computeOralResult(inputs: OralCalcInputs): PertOralResult {
  const { fatGrams, lipasePerKgPerMeal, strengthValue } = inputs;
  if (
    !Number.isFinite(fatGrams) ||
    fatGrams <= 0 ||
    !Number.isFinite(lipasePerKgPerMeal) ||
    lipasePerKgPerMeal <= 0 ||
    !Number.isFinite(strengthValue) ||
    strengthValue <= 0
  ) {
    return {
      capsulesPerDose: 0,
      totalLipase: 0,
      lipasePerDose: 0,
      estimatedDailyTotal: 0
    };
  }
  const totalLipase = fatGrams * lipasePerKgPerMeal;
  const capsulesPerDose = Math.round(totalLipase / strengthValue);
  const lipasePerDose = capsulesPerDose * strengthValue;
  const estimatedDailyTotal = capsulesPerDose * 3;
  return { capsulesPerDose, totalLipase, lipasePerDose, estimatedDailyTotal };
}

/**
 * Compute tube-feed PERT result.
 *
 * xlsx-canonical formula (D-16, user-locked 2026-04-25):
 *   totalFatG        = (formulaFatGPerL × volumePerDayMl) / 1000     (xlsx B7 family)
 *   totalLipase      = totalFatG × lipasePerKgPerDay                 (xlsx tube B12 = B8*B9)
 *   capsulesPerDay   = Math.round(totalLipase / strengthValue)       (xlsx B14 = ROUND(B12/B11, 0))
 *   lipasePerKg      = totalLipase / weightKg                        (xlsx B13 — secondary display)
 *   capsulesPerMonth = Math.round(capsulesPerDay × 30)               (D-12)
 *
 * Returns zeros if any input is null/NaN, ≤ 0, or division-by-zero.
 */
export function computeTubeFeedResult(inputs: TubeFeedCalcInputs): PertTubeFeedResult {
  const {
    formulaFatGPerL,
    volumePerDayMl,
    lipasePerKgPerDay,
    weightKg,
    strengthValue
  } = inputs;
  if (
    !Number.isFinite(formulaFatGPerL) ||
    formulaFatGPerL <= 0 ||
    !Number.isFinite(volumePerDayMl) ||
    volumePerDayMl <= 0 ||
    !Number.isFinite(lipasePerKgPerDay) ||
    lipasePerKgPerDay <= 0 ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isFinite(strengthValue) ||
    strengthValue <= 0
  ) {
    return {
      capsulesPerDay: 0,
      totalLipase: 0,
      totalFatG: 0,
      lipasePerKg: 0,
      capsulesPerMonth: 0
    };
  }
  const totalFatG = (formulaFatGPerL * volumePerDayMl) / 1000;
  const totalLipase = totalFatG * lipasePerKgPerDay;
  const capsulesPerDay = Math.round(totalLipase / strengthValue);
  const lipasePerKg = totalLipase / weightKg;
  const capsulesPerMonth = Math.round(capsulesPerDay * 30);
  return { capsulesPerDay, totalLipase, totalFatG, lipasePerKg, capsulesPerMonth };
}

/**
 * Daily lipase total (units/day) — used by {@link getTriggeredAdvisories} to
 * check the 10,000 units/kg/day cap (PERT-SAFE-01 / D-05).
 *
 *   Oral:      capsulesPerDose × strengthValue × 3   (3 meals/day)
 *   Tube-Feed: capsulesPerDay × strengthValue        (already a daily total)
 *
 * Returns 0 on null/NaN/≤ 0 inputs (defensive — never produces Infinity / NaN).
 */
export function dailyLipaseUnits(
  mode: PertMode,
  capsules: number,
  strengthValue: number
): number {
  if (
    !Number.isFinite(capsules) ||
    capsules <= 0 ||
    !Number.isFinite(strengthValue) ||
    strengthValue <= 0
  ) {
    return 0;
  }
  if (mode === 'oral') return capsules * strengthValue * 3;
  return capsules * strengthValue;
}

/**
 * Resolve a named advisory `field` to its numeric value in the current state.
 * Returns `null` for unknown fields or for fields that are themselves null in
 * state — caller skips advisories whose field cannot be resolved.
 */
function resolveFieldValue(field: string, state: PertStateData): number | null {
  if (field === 'weightKg') return state.weightKg;
  if (field === 'strengthValue') return state.strengthValue;
  if (field === 'fatGrams') return state.oral.fatGrams;
  if (field === 'lipasePerKgPerMeal') return state.oral.lipasePerKgPerMeal;
  if (field === 'volumePerDayMl') return state.tubeFeed.volumePerDayMl;
  if (field === 'lipasePerKgPerDay') return state.tubeFeed.lipasePerKgPerDay;
  return null;
}

/**
 * Severity rank for D-10 sort: stop > warning. Stable: equal ranks preserve
 * config order via Array.prototype.sort being stable in modern JS engines.
 */
function severityRank(s: AdvisorySeverity): number {
  return s === 'stop' ? 1 : 0;
}

/**
 * Run the advisory engine.
 *
 * Pure function. Takes the current mode, the resolved input values (from
 * state), the result object (or `null` on empty-state), and the static
 * advisory config array.
 *
 * Returns triggered advisories sorted SEVERITY-DESC (stop first, then
 * warning, preserving JSON config order within each tier — D-10).
 *
 * Special case: the `max-lipase-cap` advisory (id) is severity `stop` and is
 * triggered by the literal cross-input rule per D-03:
 *      dailyLipase > weightKg × MAX_LIPASE_PER_KG_PER_DAY
 * The JSON entry's `field: "computed"` + `comparator: "gt"` + `value: 0` is a
 * marker; this function ignores those generic fields and runs the literal
 * check using {@link dailyLipaseUnits}.
 *
 * Other advisories (weight-out-of-range / fat-out-of-range / volume-out-of-range)
 * use the standard `outside` comparator on the named input field.
 *
 * Empty-state gate (D-08): when `result === null` no advisories fire — there
 * is no cap to check, and range-warning advisories are also hidden for
 * consistency with the feeds analog and UI-SPEC §IA "When ANY required input
 * is missing/invalid ...range-warning advisories: HIDDEN".
 */
export function getTriggeredAdvisories(
  mode: PertMode,
  state: PertStateData,
  result: PertOralResult | PertTubeFeedResult | null,
  advisoryConfig: Advisory[]
): TriggeredAdvisory[] {
  if (result === null) return [];

  const triggered: TriggeredAdvisory[] = [];

  for (const advisory of advisoryConfig) {
    // Filter by mode — accept 'both' or matching mode
    if (advisory.mode !== mode && advisory.mode !== 'both') continue;

    if (advisory.id === 'max-lipase-cap') {
      // D-03: literal cross-input rule — JSON `field/comparator/value` is a marker.
      const weightKg = state.weightKg;
      if (weightKg === null || weightKg <= 0) continue;
      const strengthValue = state.strengthValue;
      if (strengthValue === null || strengthValue <= 0) continue;
      const capsules =
        mode === 'oral'
          ? (result as PertOralResult).capsulesPerDose
          : (result as PertTubeFeedResult).capsulesPerDay;
      const dailyLipase = dailyLipaseUnits(mode, capsules, strengthValue);
      if (dailyLipase > weightKg * MAX_LIPASE_PER_KG_PER_DAY) {
        triggered.push({
          id: advisory.id,
          message: advisory.message,
          severity: advisory.severity
        });
      }
      continue;
    }

    // Standard `outside` comparator on named input field.
    const fieldValue = resolveFieldValue(advisory.field, state);
    if (fieldValue === null) continue;

    if (
      advisory.comparator === 'outside' &&
      typeof advisory.value === 'object' &&
      advisory.value !== null &&
      'min' in advisory.value &&
      'max' in advisory.value
    ) {
      const { min, max } = advisory.value;
      if (fieldValue < min || fieldValue > max) {
        triggered.push({
          id: advisory.id,
          message: advisory.message,
          severity: advisory.severity
        });
      }
    }
    // (Other comparators 'gt'/'gte'/'lt'/'lte' are not used by Phase 2's 4
    //  shipped advisories; if a future advisory uses them, extend here.)
  }

  // D-10: severity-DESC sort. Stable: preserves config order within each tier.
  return triggered.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}
